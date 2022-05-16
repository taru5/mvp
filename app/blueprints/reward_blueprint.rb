class RewardBlueprint < Blueprinter::Base
  fields :id

  view :normal do
    fields :amount, :created_at

    association :user, blueprint: UserBlueprint, view: :normal
  end
end
