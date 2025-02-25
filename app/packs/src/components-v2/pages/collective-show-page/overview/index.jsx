import { Avatar, Icon, Tag, Typography } from "@talentprotocol/design-system";
import React from "react";
import { Banner } from "src/components-v2/banner";
import {
  BannerContainer,
  DataContainer,
  HeaderContainer,
  InfoColumn,
  LocationContainer,
  Logo,
  LogoColumn,
  LogoContainer,
  MemberAvatar,
  MemberAvatars,
  MemberCount,
  MembersContainer,
  TagsContainer,
  Title,
  ElectionInfoRow,
  ElectionInfoContainer,
  StyledTypographyLink
} from "./styled";
import SocialRow from "src/components/profile/SocialRow";
import { useWindowDimensionsHook } from "src/utils/window";
import dayjs from "dayjs";
import Tooltip from "src/components/design_system/tooltip";

const NUMBER_OF_TAGS = 4;
const NUMBER_OF_TAGS_MOBILE = 1;
const NUMBER_OF_USERS = 4;

const Overview = ({ collective, members, membersCount }) => {
  const { mobile } = useWindowDimensionsHook();

  const mainTag = () => {
    if (collective.type === "team") {
      return "Company";
    } else if (collective.type === "community") {
      return "Community";
    } else {
      return "Event";
    }
  };

  const memberDescription = (count, hasElection) => {
    if (count > 1) {
      if (hasElection) {
        return "candidates";
      } else {
        return "members";
      }
    } else {
      if (hasElection) {
        return "candidate";
      } else {
        return "member";
      }
    }
  };

  const applicationPeriod = () => {
    const startDate = dayjs(collective.election.startDate);
    const endDate = dayjs(collective.election.votingEndDate);

    return `${startDate.format("DD/MMM")} - ${endDate.format("DD/MMM")}`;
  };

  const votingPeriod = () => {
    const startDate = dayjs(collective.election.votingStartDate);
    const endDate = dayjs(collective.election.votingEndDate);

    return `${startDate.format("DD/MMM")} - ${endDate.format("DD/MMM")}`;
  };

  return (
    <div>
      <BannerContainer>
        <LogoColumn>
          <LogoContainer>
            <Logo src={collective.logoUrl} />
          </LogoContainer>
        </LogoColumn>
        <Banner bannerUrl={collective.bannerUrl} />
      </BannerContainer>
      <DataContainer>
        <InfoColumn>
          <HeaderContainer>
            <Title>
              <Typography color="primary01" specs={{ variant: "h4" }}>
                {collective.name}
              </Typography>
              {collective.verified && <Icon name="verified-2" size={20} />}
            </Title>
            <TagsContainer>
              <Tag backgroundColor="primary" key={mainTag()} label={mainTag()} size="medium" textColor="bg01" />
              {mobile ? (
                <>
                  {collective.tags
                    .filter((_tag, index) => index < NUMBER_OF_TAGS_MOBILE)
                    .map(tag => (
                      <Tag borderColor="surfaceHover02" key={tag} label={tag} size="medium" textColor="primary02" />
                    ))}
                </>
              ) : (
                <>
                  {collective.tags
                    .filter((_tag, index) => index < NUMBER_OF_TAGS)
                    .map(tag => (
                      <Tag borderColor="surfaceHover02" key={tag} label={tag} size="medium" textColor="primary02" />
                    ))}
                </>
              )}

              {collective.tags.length > 4 && mobile && (
                <Tag
                  borderColor="surfaceHover02"
                  key={"more-tags"}
                  label={`+${collective.tags.filter((_tag, index) => index >= NUMBER_OF_TAGS_MOBILE).length}`}
                  size="medium"
                  textColor="primary02"
                />
              )}
              {collective.tags.length > 4 && !mobile && (
                <Tag
                  borderColor="surfaceHover02"
                  key={"more-tags"}
                  label={`+${collective.tags.filter((_tag, index) => index >= NUMBER_OF_TAGS).length}`}
                  size="medium"
                  textColor="primary02"
                />
              )}
            </TagsContainer>
            {collective.description && (
              <Typography color="primary03" specs={{ variant: "p1" }}>
                {collective.description}
              </Typography>
            )}
          </HeaderContainer>
          {collective.location && (
            <LocationContainer>
              <Icon name="pin" color="primary04" size={16} />
              <Typography color="primary03" specs={{ variant: "p2" }}>
                {collective.location}
              </Typography>
            </LocationContainer>
          )}
          <MembersContainer>
            {membersCount > 0 && (
              <MemberAvatars>
                {members
                  .filter((user, index) => index < NUMBER_OF_USERS && !!user.profilePictureUrl)
                  .map(user => (
                    <MemberAvatar key={user.id}>
                      <Avatar size="sm" url={user.profilePictureUrl} />
                    </MemberAvatar>
                  ))}
              </MemberAvatars>
            )}
            <MemberCount>
              <Typography color="primary01" specs={{ type: "bold", variant: "p2" }}>
                {membersCount}
              </Typography>{" "}
              <Typography color="primary04" specs={{ variant: "p2" }}>
                {memberDescription(membersCount, collective.election)}
              </Typography>
            </MemberCount>
          </MembersContainer>
          {!!collective.election && (
            <ElectionInfoContainer>
              <ElectionInfoRow>
                <Typography color="primary01" specs={{ type: "bold", variant: "p2" }}>
                  Applications
                </Typography>
                <Typography color="primary04" specs={{ type: "regular", variant: "p2" }}>
                  {applicationPeriod()}
                </Typography>
              </ElectionInfoRow>
              <ElectionInfoRow>
                <Typography color="primary01" specs={{ type: "bold", variant: "p2" }}>
                  Voting Period
                </Typography>
                <Typography color="primary04" specs={{ type: "regular", variant: "p2" }}>
                  {votingPeriod()}
                </Typography>
              </ElectionInfoRow>
              <ElectionInfoRow>
                <Typography color="primary01" specs={{ type: "bold", variant: "p2" }}>
                  Total Votes
                </Typography>
                <Typography color="primary04" specs={{ type: "regular", variant: "p2" }}>
                  {collective.election.voteCount}
                </Typography>
              </ElectionInfoRow>
              <ElectionInfoRow>
                <Typography color="primary01" specs={{ type: "bold", variant: "p2" }}>
                  My Votes
                </Typography>
                <Typography color="primary04" specs={{ type: "regular", variant: "p2" }}>
                  {collective.currentUserTotalVotes}
                </Typography>
              </ElectionInfoRow>
              <ElectionInfoRow>
                <Typography color="primary01" specs={{ type: "bold", variant: "p2" }}>
                  My Votes Cost
                </Typography>
                <Typography color="primary04" specs={{ type: "regular", variant: "p2" }}>
                  {collective.currentUserTalSpent} $TAL
                </Typography>
              </ElectionInfoRow>
              <ElectionInfoRow>
                <Typography color="primary01" specs={{ type: "bold", variant: "p2" }}>
                  Prize Pool
                </Typography>
                <Typography color="primary04" specs={{ type: "regular", variant: "p2" }}>
                  {collective.election.prizePool} $TAL
                </Typography>
                <Tooltip
                  popOverAccessibilityId="prizePool"
                  placement="top"
                  body="The $TAL from all votes will go into this prize pool. The pool will be distributed back to the users who voted for the winning candidates, after October 8th."
                >
                  <div>
                    <Icon name="information" color="primary04" size={15} />
                  </div>
                </Tooltip>
              </ElectionInfoRow>
              <ElectionInfoRow>
                <StyledTypographyLink target="_blank" href={collective.election.learnMoreUrl}>
                  Learn more {">"}
                </StyledTypographyLink>
              </ElectionInfoRow>
            </ElectionInfoContainer>
          )}
          <SocialRow profile={collective} />
        </InfoColumn>
      </DataContainer>
    </div>
  );
};

export default Overview;
