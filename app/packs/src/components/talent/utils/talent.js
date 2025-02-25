import { compareStrings, compareNumbers, compareDates } from "src/utils/compareHelpers";
import { ethers } from "ethers";

export const completeProfile = args => {
  return missingFields(args).length == 0;
};

export const missingFields = ({ talent, profilePictureUrl, careerGoal }) => {
  const fields = [];
  if (!talent.profile?.occupation || talent.profile.occupation == "") {
    fields.push("Occupation");
  }
  if (!talent.profile?.headline || talent.profile.headline == "") {
    fields.push("Headline");
  }
  if (!profilePictureUrl || profilePictureUrl == "") {
    fields.push("Profile picture");
  }
  if (!careerGoal?.pitch || careerGoal.pitch == "") {
    fields.push("About");
  }
  if (!talent?.verified) {
    fields.push("Being verified");
  }

  return fields;
};

export const profileProgress = ({ talent, profilePictureUrl, token, career_goal, milestones, goals, tags, user }) => {
  let total = 100;
  const fields = missingFields({
    talent,
    profilePictureUrl,
    token,
    career_goal
  });

  if (milestones.length == 0) {
    total -= 10;
  }

  if (goals.length == 0) {
    total -= 10;
  }

  if (tags.length == 0) {
    total -= 10;
  }

  if (!user.wallet_id || user.wallet_id == "") {
    total -= 10;
  }

  return total - fields.length * 10;
};

export const compareName = (talent1, talent2) => compareStrings(talent1.user.name, talent2.user.name);

export const compareOccupation = (talent1, talent2) => compareStrings(talent1.occupation, talent2.occupation);

export const compareSupporters = (talent1, talent2) => compareNumbers(talent1.supportersCount, talent2.supportersCount);

export const compareMarketCap = (talent1, talent2) => {
  const talent1Amount = ethers.utils.parseUnits(talent1.marketCap?.replaceAll(",", "") || "0");
  const talent2Amount = ethers.utils.parseUnits(talent2.marketCap?.replaceAll(",", "") || "0");

  return compareNumbers(talent1Amount, talent2Amount);
};

export const compareMarketCapVariance = (talent1, talent2) =>
  compareNumbers(talent1.marketCapVariance, talent2.marketCapVariance);

export const compareDate = (talent1, talent2) => compareDates(talent1.lastTimeBoughtAt, talent2.lastTimeBoughtAt);
