require "rails_helper"
require "web3_api/api_proxy"

RSpec.describe Elections::Vote do
  subject(:vote_on_election) do
    described_class.new(
      voter: voter,
      election: election,
      candidate: candidate,
      number_of_votes: number_of_votes,
      chain_id: chain_id
    ).call
  end

  let(:voter) { create(:user, wallet_id: "12312") }
  let(:candidate) { create :user }
  let(:election) { create(:election, start_date: Date.today - 1.day, voting_start_date: Date.today) }
  let(:chain_id) { 44787 }
  let(:number_of_votes) { 3 }

  let!(:takeoff_vote_quest) { create :quest, quest_type: "takeoff_vote" }
  let(:refresh_user_quest_class) { Quests::RefreshUserQuest }
  let(:refresh_user_quest_instance) { instance_double(refresh_user_quest_class, call: true) }

  before do
    allow(refresh_user_quest_class).to receive(:new).and_return(refresh_user_quest_instance)
  end

  describe "with insufficient data" do
    it "does not create a vote if the voter has no wallet" do
      voter.update!(wallet_id: nil)

      result = vote_on_election
      expect(result[:error]).to eq("No wallet connected.")
    end

    it "does not create a vote if the election voting is not active" do
      election.update!(voting_start_date: Date.today + 1.day)

      result = vote_on_election
      expect(result[:error]).to eq("The voting period is not active.")
    end

    it "does not create a vote if the candidate is not a candidate" do
      result = vote_on_election
      expect(result[:error]).to eq("You cannot vote for someone who is not a candidate.")
    end
  end

  describe "with no number of votes" do
    let(:number_of_votes) { 0 }

    it "does not create a vote if the number of votes is not positive" do
      result = vote_on_election
      expect(result[:error]).to eq("At least one vote must be cast.")
    end
  end

  describe "with the same voter and candidate" do
    let(:candidate) { voter }
    it "does not create a vote if the voter is the candidate" do
      result = vote_on_election
      expect(result[:error]).to eq("You cannot vote for yourself.")
    end
  end

  describe "with an unsupported chain" do
    let(:chain_id) { 1 }

    it "does not create a vote if the chain is not supported" do
      result = vote_on_election
      expect(result[:error]).to eq("Unsupported chain.")
    end
  end

  context "with insufficient balance" do
    let(:eth_client_class) { Eth::Client }
    let(:provider) { instance_double(eth_client_class) }
    let(:eth_contract_class) { Eth::Contract }
    let(:eth_contract) { instance_double(eth_contract_class) }
    let(:balance) { 0 }

    before do
      allow(eth_client_class).to receive(:create).and_return(provider)
      allow(provider).to receive(:call).and_return(balance)
      allow(eth_contract_class).to receive(:from_abi).and_return(eth_contract)
      create :membership, user: candidate, organization: election.organization
    end

    it "does not create a vote without balance" do
      result = vote_on_election

      expect(result[:error]).to eq("Insufficient virtual TAL balance. Try a different chain.")
    end

    context "when there's some balance but the wallet already exceed it" do
      let(:balance) { 10 }

      before do
        create :vote, election: election, wallet_id: voter.wallet_id, cost: "10"
      end

      it "does not create a vote without balance" do
        result = vote_on_election

        expect(result[:error]).to eq("Insufficient virtual TAL balance. Try a different chain.")
      end
    end
  end

  describe "with correct data" do
    let(:eth_client_class) { Eth::Client }
    let(:provider) { instance_double(eth_client_class) }
    let(:eth_contract_class) { Eth::Contract }
    let(:eth_contract) { instance_double(eth_contract_class) }
    let(:create_notification_class) { CreateNotification }
    let(:create_notification_instance) { instance_double(create_notification_class, call: true) }

    before do
      allow(eth_client_class).to receive(:create).and_return(provider)
      allow(provider).to receive(:call).and_return(100000000000000000000)
      allow(eth_contract_class).to receive(:from_abi).and_return(eth_contract)
      allow(create_notification_class).to receive(:new).and_return(create_notification_instance)
      membership = election.organization.memberships.new(active: true, user: candidate)
      membership.save!
    end

    it "creates a vote" do
      expect { vote_on_election }.to change { Vote.count }.by(1)
    end

    it "creates a vote with the correct data" do
      vote_on_election
      vote = Vote.last

      expect(vote.voter).to eq(voter)
      expect(vote.election).to eq(election)
      expect(vote.candidate).to eq(candidate)
      expect(vote.amount).to eq(number_of_votes)
      expect(vote.cost).to eq("6000000000000000000")
    end

    it "creates a second vote with the correct cost" do
      vote_on_election
      Elections::Vote.new(
        voter: voter,
        election: election,
        candidate: candidate,
        number_of_votes: 1,
        chain_id: chain_id
      ).call

      vote = Vote.last

      expect(vote.cost).to eq("4000000000000000000")
    end

    it "initializes and calls the refresh user quest service" do
      vote_on_election

      expect(refresh_user_quest_class).to have_received(:new).with(
        user: voter,
        quest: takeoff_vote_quest
      )
      expect(refresh_user_quest_instance).to have_received(:call)
    end

    it "initializes and calls the create notification to all subscribers" do
      vote_on_election

      vote = Vote.last

      expect(create_notification_class).to have_received(:new)
      expect(create_notification_instance).to have_received(:call).with(
        extra_params: {
          vote_id: vote.id,
          election_id: election.id
        },
        recipient: candidate,
        source_id: voter.id,
        type: ElectionVoteReceivedNotification
      )
    end
  end
end
