require "rails_helper"

RSpec.describe Users::Search do
  subject(:search_users) { described_class.new(search_params: search_params).call }

  let!(:collective) { create :org_election, slug: "take-off" }
  let!(:user_1) { create :user, username: "johndoe", messaging_disabled: true }
  let!(:membership_1) { create :membership, organization: collective, user: user_1 }
  let!(:user_2) { create :user, username: "johny", messaging_disabled: false }
  let!(:membership_2) { create :membership, organization: collective, user: user_2 }
  let!(:user_3) { create :user, username: "alice", messaging_disabled: false }
  let!(:user_4) { create :user, username: "elon", messaging_disabled: true }

  context "when search params are empty" do
    let(:search_params) { {} }

    it "returns all users except the current user" do
      expect(search_users).to match_array([user_1, user_2, user_3, user_4])
    end
  end

  context "when the name is passed" do
    let(:search_params) do
      {
        name: "john"
      }
    end

    it "returns all users with username matching the name" do
      expect(search_users).to match_array([user_1, user_2])
    end
  end

  context "when the collective id passed" do
    let(:search_params) do
      {
        collective_slug: "take-off"
      }
    end

    it "returns all users that are part of the collective" do
      expect(search_users).to match_array([user_1, user_2])
    end
  end

  context "when the messaging_disabled is passed" do
    context "when messaging_disabled is true" do
      let(:search_params) do
        {
          messaging_disabled: true
        }
      end

      it "returns all users with messaging_mode disabled" do
        expect(search_users).to match_array([user_1, user_4])
      end
    end

    context "when messaging_disabled is false" do
      let(:search_params) do
        {
          messaging_disabled: false
        }
      end

      it "returns all users with messaging_mode enabled" do
        expect(search_users).to match_array([user_2, user_3])
      end
    end
  end
end
