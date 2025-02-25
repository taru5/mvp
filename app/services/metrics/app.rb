require "sendgrid-ruby"

module Metrics
  module App
    ONBOARDING_START_DATE = Date.new(2022, 10, 13)
    SEASON_3_START_DATE = Date.new(2023, 0o1, 0o1)
    SEASON_3_END_DATE = Date.new(2023, 0o6, 30)
    SEASON_4_START_DATE = Date.new(2023, 7, 1)
    SEASON_4_END_DATE = Date.new(2023, 12, 31)

    def date
      # Job is being trigger at GMT+1 date and our db is running in UTC (1 hour difference)
      Time.current.in_time_zone("Europe/Lisbon").to_date - 1.day
    end

    def total_users_created
      User.last.id
    end

    def total_users
      User.count
    end

    def total_connected_wallets
      User.where.not(wallet_id: nil).count
    end

    def total_active_users
      User.where("users.last_access_at > ? and users.last_access_at::date != users.created_at::date", one_month_ago).count
    end

    def total_verified_users
      Talent.where(verified: true).count
    end

    def total_linkedin_signups
      User.where.not(linkedin_id: nil).count
    end

    def total_email_signups
      User.where(linkedin_id: nil).count
    end

    def total_app_notifications
      Notification.count
    end

    def total_app_read_notifications
      Notification.where.not(read_at: nil).count
    end

    def total_emails_sent_by_app
      sendgrid_global_stats.sum { |d| d["stats"][0]["metrics"]["requests"] }
    end

    def total_emails_delivered
      sendgrid_global_stats.sum { |d| d["stats"][0]["metrics"]["delivered"] }
    end

    def total_emails_opened
      sendgrid_global_stats.sum { |d| d["stats"][0]["metrics"]["unique_opens"] }
    end

    def sendgrid_global_stats
      @sendgrid_global_stats ||= begin
        response = sendgrid_api.client.stats.get(query_params: {start_date: "2022-01-01", aggregated_by: "month"})

        return unless response.status_code == "200"

        JSON.parse(response.body)
      end
    end

    def sendgrid_api
      SendGrid::API.new(api_key: ENV["SENDGRID_API_KEY"])
    end

    def total_dead_accounts
      query = <<~SQL
        SELECT COUNT(*)
        FROM users
        WHERE (
            users.last_access_at > (current_date - interval '60' day)
            AND DATE(users.created_at) = DATE(users.last_access_at)
        ) OR users.last_access_at < (current_date - interval '180' day)
      SQL

      sanitized_sql = ActiveRecord::Base.sanitize_sql_array([query])

      ActiveRecord::Base.connection.execute(sanitized_sql).first["count"]
    end

    def total_engaged_users
      query = <<~SQL
        SELECT COUNT(*)
        FROM users
        WHERE users.id IN (
            select talent.user_id
            from talent
            left join talent_tokens on talent.id = talent_tokens.talent_id
            left join career_goals on talent.id = career_goals.talent_id
            left join milestones on talent.id = milestones.talent_id
            left join goals on career_goals.id = goals.career_goal_id
            where talent.updated_at > :one_month_ago
            OR talent_tokens.updated_at > :one_month_ago
            OR career_goals.updated_at > :one_month_ago
            OR milestones.updated_at > :one_month_ago
            OR milestones.created_at > :one_month_ago
            OR goals.updated_at > :one_month_ago
            OR goals.created_at > :one_month_ago
        )
        OR users.wallet_id IN (
            select talent_supporters.supporter_wallet_id
            from talent_supporters
            where talent_supporters.last_time_bought_at > :one_month_ago
        )
        OR users.id IN (
            select messages.sender_id
            from messages
            where messages.created_at > :one_month_ago
        )
        OR users.id IN (
            select subscriptions.subscriber_id
            from subscriptions
            where subscriptions.created_at > :one_month_ago
        )
      SQL

      sanitized_sql = ActiveRecord::Base.sanitize_sql_array([query, one_month_ago: one_month_ago])

      ActiveRecord::Base.connection.execute(sanitized_sql).first["count"]
    end

    def total_advocates
      query = <<~SQL
        SELECT COUNT(DISTINCT users.id)
        FROM users
        INNER JOIN invites on users.id = invites.user_id
        WHERE onboarded_at IS NOT NULL AND
        invites.id IN (
            SELECT invite_id
            FROM users
            WHERE onboarded_at IS NOT NULL
        )
      SQL

      sanitized_sql = ActiveRecord::Base.sanitize_sql_array([query, date: date])

      ActiveRecord::Base.connection.execute(sanitized_sql).first["count"]
    end

    def total_scouts
      query = <<~SQL
        SELECT COUNT(DISTINCT user_id)
        FROM invites
        where id IN (
            SELECT invite_id
            FROM users
            INNER JOIN talent on users.id = talent.user_id
            INNER JOIN talent_tokens on talent.id = talent_tokens.talent_id
            WHERE talent_tokens.contract_id IS NOT NULL
        )
      SQL

      sanitized_sql = ActiveRecord::Base.sanitize_sql_array([query, date: date])

      ActiveRecord::Base.connection.execute(sanitized_sql).first["count"]
    end

    def total_onboarded_users
      User.where.not(onboarded_at: nil).count
    end

    def total_talent_token_applications
      query = <<~SQL
        SELECT COUNT(DISTINCT(user_id))
        FROM user_profile_type_changes
        where new_profile_type = 'waiting_for_approval'
        and created_at::date <= :date
      SQL

      sanitized_sql = ActiveRecord::Base.sanitize_sql_array([query, date: date])

      ActiveRecord::Base.connection.execute(sanitized_sql).first["count"]
    end

    def total_approved_talent_token_applications
      query = <<~SQL
        SELECT COUNT(DISTINCT(user_id))
        FROM user_profile_type_changes
        where new_profile_type = 'approved'
        and created_at::date <= :date
      SQL

      sanitized_sql = ActiveRecord::Base.sanitize_sql_array([query, date: date])

      ActiveRecord::Base.connection.execute(sanitized_sql).first["count"]
    end

    def time_on_page
      analytics_json["seconds_on_page"].to_i
    end

    def daily_visitors
      analytics_json["visitors"]
    end

    def analytics_json
      @analytics_json ||= begin
        resp = Faraday.get(
          "https://simpleanalytics.com/beta.talentprotocol.com.json",
          {
            start: date.beginning_of_day,
            end: date.end_of_day,
            info: false,
            fields: "pages,seconds_on_page,visitors",
            version: 5
          }
        )
        JSON.parse(resp.body)
      end
    end

    def total_twitter_followers
      resp = Faraday.get("https://api.twitter.com/2/users/1383059435111780352?user.fields=public_metrics", {}, {Authorization: "Bearer #{ENV["TWITTER_API_TOKEN"]}"})
      body = JSON.parse(resp.body)

      return 0 if body["errors"]&.any?

      if body["data"]&.any? && body["data"]["public_metrics"]&.any?
        body["data"]["public_metrics"]["followers_count"]
      else
        0
      end
    end

    def total_discord_members
      resp = Faraday.get("https://discord.com/api/v9/invites/talentprotocol?with_counts=true&with_expiration=true", {})
      body = JSON.parse(resp.body)
      body["approximate_member_count"]
    end

    def collect_onboarding_metrics(daily_metric)
      daily_metric.total_old_users_season_4 = User.where("created_at < ? AND onboarded_at between ? AND ?", ONBOARDING_START_DATE, SEASON_4_START_DATE, SEASON_4_END_DATE).count
      season_4_created_and_onboarded = User.where("created_at >= ? AND onboarded_at between ? AND ?", SEASON_4_START_DATE, SEASON_4_START_DATE, SEASON_4_END_DATE)
      daily_metric.total_new_users_season_4 = season_4_created_and_onboarded.count
      daily_metric.total_organic_users_season_4 = season_4_created_and_onboarded.where(invite_id: nil).count
      daily_metric.total_referral_users_season_4 = season_4_created_and_onboarded.where.not(invite_id: nil).count
      daily_metric
    end

    def total_users_with_subscribers
      query = <<~SQL
        SELECT COUNT(DISTINCT(user_id))
        FROM subscriptions
        WHERE accepted_at::date <= :date
      SQL

      sanitized_sql = ActiveRecord::Base.sanitize_sql_array([query, date: date])

      ActiveRecord::Base.connection.execute(sanitized_sql).first["count"]
    end

    def total_users_subscribing
      query = <<~SQL
        SELECT COUNT(DISTINCT(subscriber_id))
        FROM subscriptions
        WHERE accepted_at::date <= :date
      SQL

      sanitized_sql = ActiveRecord::Base.sanitize_sql_array([query, date: date])

      ActiveRecord::Base.connection.execute(sanitized_sql).first["count"]
    end

    def total_users_with_three_or_more_subscribers
      query = <<~SQL
        SELECT COUNT(*) 
        FROM (
          SELECT user_id
          FROM subscriptions
          WHERE accepted_at::date <= :date
          GROUP BY user_id
          HAVING COUNT(*) > 2
        ) as counts
      SQL

      sanitized_sql = ActiveRecord::Base.sanitize_sql_array([query, date: date])

      ActiveRecord::Base.connection.execute(sanitized_sql).first["count"]
    end

    def total_users_subscribing_three_or_more
      query = <<~SQL
        SELECT COUNT(*) 
        FROM (
          SELECT subscriber_id
          FROM subscriptions
          WHERE accepted_at::date <= :date
          GROUP BY subscriber_id
          HAVING COUNT(*) > 2
        ) as counts
      SQL

      sanitized_sql = ActiveRecord::Base.sanitize_sql_array([query, date: date])

      ActiveRecord::Base.connection.execute(sanitized_sql).first["count"]
    end

    def total_users_with_career_updates
      CareerUpdate.distinct(:user_id).select(:user_id).count
    end

    def total_career_updates
      CareerUpdate.count
    end

    def daily_conversion_rate
      registered_users = User.where("created_at BETWEEN ? AND ?", date.beginning_of_day, date.end_of_day).count
      registered_users.to_f / daily_join_pages_visitors
    end

    def daily_join_pages_visitors
      resp = Faraday.get(
        "https://simpleanalytics.com/beta.talentprotocol.com/join*.json",
        {
          start: date.beginning_of_day,
          end: date.end_of_day,
          info: false,
          fields: "visitors",
          version: 5
        }
      )
      JSON.parse(resp.body)["visitors"]
    end

    def total_claimed_domains
      UserDomain.where(tal_domain: true).count
    end

    def one_month_ago
      @one_month_ago ||= 31.days.ago.beginning_of_day
    end

    def total_unique_sponsors
      Sponsorship.all.distinct.pluck(:sponsor).count
    end

    def total_unique_sponsoring
      Sponsorship.all.distinct.pluck(:talent).count
    end

    def total_messages
      Message.where(sent_to_supporters: false, career_update_id: nil).count
    end

    def total_messages_read
      Message.where(sent_to_supporters: false, career_update_id: nil, is_read: true).count
    end

    def total_users_that_sent_messages
      Message.where(sent_to_supporters: false, career_update_id: nil).distinct.pluck(:sender_id).count
    end

    def total_users_that_received_messages
      Message.where(sent_to_supporters: false, career_update_id: nil).distinct.pluck(:receiver_id).count
    end

    def total_users_with_active_goals
      Goal
        .where(progress: Goal::DOING)
        .where("goals.due_date >= ?", Date.today)
        .distinct
        .pluck(:user_id)
        .count
    end

    def total_experience_points
      ExperiencePoint.all.sum(&:amount)
    end
  end
end
