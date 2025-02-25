class ApplicationController < ActionController::Base
  include Clearance::Controller
  include Pagy::Backend

  before_action :track_user_activity
  before_action :set_paper_trail_whodunnit

  layout "application"

  protect_from_forgery

  rescue_from ActiveRecord::RecordNotFound, with: :render_404

  helper_method :is_user_impersonated?, :current_acting_user, :current_impersonated_user, :active_theme, :tal_domain

  def render_404
    respond_to do |format|
      format.html { render "errors/404", status: :not_found }
      format.json { render json: {error: "Not found"}, status: :not_found }
    end
  end

  def route_not_found
    if Rails.env.development? || Rails.env.test?
      raise ActionController::RoutingError.new("We didn't find any routes that match your request.")
    else
      respond_to do |format|
        format.html { redirect_to root_path }
        format.json {
          render(
            json: {message: "We didn't find any routes that match your request."},
            status: :not_found
          )
        }
      end
    end
  rescue ActionController::UnknownFormat
    redirect_to root_path
  end

  def current_impersonated_user
    @current_impersonated_user ||= user_from_impersonated_cookie
    @current_impersonated_user
  end

  def is_user_impersonated?
    current_impersonated_user.present?
  end

  def current_acting_user
    is_user_impersonated? ? current_impersonated_user : current_user
  end

  def active_theme
    return current_user.active_theme if current_user.present?

    if tal_domain
      return (tal_domain.theme == "dark") ? "dark-body" : "light-body"
    end

    "light-body"
  end

  def tal_domain
    @tal_domain ||= UserDomain.where(tal_domain: true).find_by("domain = ?", "#{request.subdomain}.#{ENV["TAL_BASE_DOMAIN"]}")
  end

  protected

  def prevent_user_impersonation
    if is_user_impersonated?
      if current_user.onboarding_complete?
        redirect_to user_root_path, flash: {error: "Unauthorized."}
      else
        redirect_to onboarding_root_path, flash: {error: "Unauthorized."}
      end
    end
  end

  private

  def track_user_activity
    # safe navigation is required for non-auth users (sign_up, login)
    current_user&.update_column(:last_access_at, Time.zone.now)
  end

  def id_param
    Integer(params[:id])
  rescue
    0
  end

  def talent_id_param
    Integer(params[:talent_id])
  rescue
    0
  end

  def current_user_active_subscribing
    current_acting_user ? current_acting_user.active_subscribing.pluck(:user_id) : []
  end

  def current_user_pending_subscribing
    current_acting_user ? current_acting_user.pending_subscribing.pluck(:user_id) : []
  end

  def user_from_impersonated_cookie
    User.find_by(username: cookies.signed[:impersonated])
  end

  def render_pagination(pagination)
    {
      totalItems: pagination.count,
      currentPage: pagination.page,
      lastPage: pagination.last,
      recordsPerPage: pagination.vars[:items]
    }
  end
end
