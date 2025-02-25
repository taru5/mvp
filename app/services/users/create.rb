module Users
  class Create
    attr_reader :result

    def initialize
      @result = {}
    end

    def call(params)
      invite = invite_from(params[:code])
      result = ActiveRecord::Base.transaction do
        invite&.update(uses: invite.uses + 1)
        params[:invite] = invite if invite
        user = create_user(params)

        create_talent(user, params)
        create_talent_token(user)

        create_invite(user)
        create_subscription(invite, user)
        create_activity_feed(user)
        create_profile_complete_activity(user.id)
        create_organization_membership(invite, user)

        @result[:user] = user
        @result[:success] = true
        @result
      rescue ActiveRecord::RecordNotUnique, ActiveRecord::RecordInvalid => error
        @result[:success] = false
        error_message = error.message.downcase

        if error_message.include?("username")
          @result[:field] = "username"
          @result[:error] = "Username is already taken."
        elsif error_message.include?("email")
          @result[:field] = "email"
          @result[:error] = "Email is already taken."
        elsif error_message.include?("wallet")
          @result[:field] = "wallet_id"
          @result[:error] = "We already have that wallet in the system."
        end
        @result
      rescue => e
        Rollbar.error(
          e,
          "Unable to create user with unexpected error.",
          email: params[:email],
          username: params[:username]
        )

        raise e
      end

      create_invite_used_notification(invite, result[:user]) if result[:success] && invite
      update_profile_completeness(result[:user])
      result
    end

    private

    def invite_from(code)
      Invite.find_by(code: code)
    end

    def create_user(params)
      user = User.new(attributes(params))
      user.onboarded_at = Time.current
      user.save!
      user
    end

    def attributes(params)
      {
        utm_source: params[:utm_source],
        email_confirmation_token: Clearance::Token.new,
        email: params[:email].downcase,
        invited: params[:invite],
        linkedin_id: params[:linkedin_id],
        password: params[:password],
        role: "basic",
        username: params[:username].downcase.delete(" ", "")
      }.compact
    end

    def create_talent(user, params)
      user.create_talent!
      user.talent.create_career_goal!
    end

    def create_talent_token(user)
      user.talent.create_talent_token!
    end

    def create_invite(user)
      service = Invites::Create.new(user: user)
      service.call
    end

    def create_invite_used_notification(invite, user)
      inviter = invite.user
      return unless inviter

      CreateNotification.new.call(recipient: inviter, source_id: user.id, type: InviteUsedNotification)
    end

    def create_subscription(invite, user)
      return unless invite

      invited_by_user = invite.user
      return unless invited_by_user

      subscription = Subscription.find_by(user_id: user.id, subscriber_id: invited_by_user.id)

      if subscription.nil? # validate if the watchlist quest is completed
        Subscription.create!(user_id: user.id, subscriber_id: invited_by_user.id, accepted_at: Time.current)
      end
    end

    def create_activity_feed(user)
      ActivityFeed.find_or_create_by(user: user)
    end

    def create_organization_membership(invite, user)
      return unless invite

      organization = invite.organization
      return unless organization

      organization.memberships.create!(active: true, user:)
    end

    def update_profile_completeness(user)
      Users::UpdateProfileCompleteness.new(user: user).call
    end

    def create_profile_complete_activity(user_id)
      ActivityIngestJob.perform_later("profile_complete", nil, user_id)
    end
  end
end
