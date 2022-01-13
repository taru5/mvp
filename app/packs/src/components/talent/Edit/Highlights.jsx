import React, { useState } from "react";

import { destroy, patch, post } from "src/utils/requests";

import H5 from "src/components/design_system/typography/h5";
import P2 from "src/components/design_system/typography/p2";
import TextInput from "src/components/design_system/fields/textinput";
import TextArea from "src/components/design_system/fields/textarea";
import Button from "src/components/design_system/button";
import Caption from "src/components/design_system/typography/caption";
import { ArrowRight, ArrowLeft, Delete } from "src/components/icons";
import LoadingButton from "src/components/button/LoadingButton";

const emptyHighlight = (id) => ({
  id: id,
  title: "",
  type: "",
  start_date: "",
  end_date: "",
  institution: "",
  location: "",
  description: "",
  link: "",
});

const HighlightForm = ({
  highlight,
  changeAttribute,
  showAddNew,
  mobile,
  mode,
  removeHighlight,
  validationErrors,
  addHighlight,
}) => {
  return (
    <>
      {/* <div className="d-flex flex-row w-100 justify-content-between mt-4 flex-wrap">
        <TextInput
          title={"Highlight type"}
          mode={mode}
          placeholder={"Project, award, position..."}
          onChange={(e) => changeAttribute("type", e.target.value)}
          value={highlight["type"]}
          className={mobile ? "w-100" : "w-50 pr-2"}
        />
        <TextInput
          title={"Location"}
          mode={mode}
          placeholder={"City, country"}
          onChange={(e) => changeAttribute("location", e.target.value)}
          value={highlight["location"]}
          className={mobile ? "w-100" : "w-50 pl-2"}
        />
      </div> */}
      <div className="d-flex flex-row w-100 justify-content-between mt-3 flex-wrap">
        <TextInput
          title={"Title"}
          mode={mode}
          shortCaption="Your position or achievement"
          onChange={(e) => changeAttribute("title", e.target.value)}
          value={highlight["title"]}
          className="w-100"
          required={true}
          error={validationErrors?.title}
        />
      </div>
      <div className="d-flex flex-row w-100 justify-content-between mt-3 flex-wrap">
        <TextInput
          title={"Institution"}
          mode={mode}
          placeholder={"Company, Client, School, University..."}
          onChange={(e) => changeAttribute("institution", e.target.value)}
          value={highlight["institution"]}
          className="w-100"
          required={true}
          error={validationErrors?.institution}
        />
      </div>
      <div className="d-flex flex-row w-100 justify-content-between mt-3">
        <TextArea
          title={"Description"}
          mode={mode}
          shortCaption="Describe what you did"
          onChange={(e) => changeAttribute("description", e.target.value)}
          value={highlight["description"]}
          className="w-100"
          maxLength="175"
          required={true}
          error={validationErrors?.description}
        />
      </div>
      <div className="d-flex flex-row w-100 justify-content-between mt-3 flex-wrap">
        <div className={`d-flex flex-column ${mobile ? "w-100" : "w-50 pr-2"}`}>
          <h6 className={`title-field ${mode}`}>
            Start Date <span className="text-danger">*</span>
          </h6>
          <input
            className={`form-control ${mode} ${
              validationErrors?.start_date ? "border-danger" : ""
            }`}
            placeholder={"Select date"}
            type="date"
            value={highlight["start_date"]}
            onChange={(e) => changeAttribute("start_date", e.target.value)}
          />
        </div>
        {!showAddNew && (
          <Button
            onClick={() => removeHighlight(highlight["id"])}
            type="white-ghost"
            mode={mode}
          >
            <Delete color="currentColor" />
          </Button>
        )}
        {/* <div className={`d-flex flex-column ${mobile ? "w-100" : "w-50 pl-2"}`}>
          <h6 className={`title-field ${mode}`}>End Date</h6>
          <input
            className={`form-control ${mode}`}
            placeholder={"Select date"}
            type="date"
            value={highlight["end_date"]}
            onChange={(e) => changeAttribute("end_date", e.target.value)}
          />
        </div> */}
      </div>
      {showAddNew && (
        <Button
          onClick={addHighlight}
          type="white-ghost"
          mode={mode}
          className="text-primary w-100 my-3"
        >
          + Add another Highlight
        </Button>
      )}
      <div className={`divider ${mode} my-3`}></div>
    </>
  );
};

const arrayToObject = (inputArray) => {
  const obj = {};

  inputArray.forEach((element) => (obj[element.id] = element));

  return obj;
};

const Highlights = (props) => {
  const {
    milestones,
    mobile,
    changeTab,
    mode,
    changeSharedState,
    togglePublicProfile,
    publicButtonType,
    disablePublicButton,
  } = props;
  const [allMilestones, setAllMilestones] = useState({
    new: emptyHighlight("new"),
    ...arrayToObject(milestones),
  });
  const [validationErrors, setValidationErrors] = useState({});
  const [hasChanges, setHasChanges] = useState({});
  const [saving, setSaving] = useState({
    loading: false,
    profile: false,
    public: false,
  });

  const changeAttribute = (key, attribute, value) => {
    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors({});
    }

    if (key != "new" && hasChanges[key] != true) {
      setHasChanges((prev) => ({ ...prev, [key]: true }));
    }

    setAllMilestones((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [attribute]: value,
      },
    }));
  };

  const sortAllMilestoneKeys = (key1, key2) => {
    if (key1.includes("new")) {
      if (key2.includes("new")) {
        return key1.length > key2.length ? -1 : 1;
      } else {
        return -1;
      }
    } else if (key2.includes("new")) {
      return -1;
    } else {
      return parseInt(key1) > parseInt(key2) ? -1 : 1;
    }
  };

  const highlightValid = (id) => {
    const errors = {};
    if (allMilestones[id].title == "") {
      errors["title"] = true;
    }
    if (allMilestones[id].institution == "") {
      errors["institution"] = true;
    }
    if (allMilestones[id].description == "") {
      errors["description"] = true;
    }
    if (allMilestones[id].start_date == "") {
      errors["start_date"] = true;
    }
    return errors;
  };

  const addHighlight = async (id) => {
    const errors = highlightValid(id);

    if (Object.keys(errors).length == 0) {
      // add new highlight and reset

      let requestType, url;
      if (id != "new") {
        requestType = patch;
        url = `/api/v1/talent/${props.talent.id}/milestones/${id}`;
      } else {
        requestType = post;
        url = `/api/v1/talent/${props.talent.id}/milestones`;
      }

      const response = await requestType(url, {
        milestone: {
          ...allMilestones[id],
        },
      }).catch(() =>
        setValidationErrors((prev) => ({ ...prev, saving: true }))
      );

      if (response) {
        // update local state
        const newMilestones = { ...allMilestones };
        newMilestones[response.id] = response;
        setAllMilestones(newMilestones);
        setHasChanges((prev) => ({ ...prev, id: false }));

        // update global state
        let newMilestonesProps = [...milestones];
        const milestoneIndex = milestones.findIndex(
          (milestone) => milestone.id == response["id"]
        );

        if (milestoneIndex > -1) {
          newMilestonesProps.splice(milestoneIndex, 1);
        }

        newMilestonesProps.push(response);

        changeSharedState((prevState) => ({
          ...prevState,
          milestones: newMilestonesProps,
        }));
      }
    } else {
      setValidationErrors((prev) => ({ ...prev, ["new"]: errors }));
    }
  };

  const removeHighlight = async (id) => {
    let response;
    if (typeof id == "number") {
      response = await destroy(
        `/api/v1/talent/${props.talent.id}/milestones/${id}`
      ).catch(() =>
        setValidationErrors((prev) => ({ ...prev, removing: true }))
      );
    } else {
      response = true;
    }

    if (response) {
      setHasChanges((prev) => ({ ...prev, id: false }));
      const milestoneIndex = milestones.findIndex(
        (milestone) => milestone.id == id
      );
      let newMilestones = [...milestones];
      if (milestoneIndex > -1) {
        newMilestones.splice(milestoneIndex, 1);
      }

      changeSharedState((prevState) => ({
        ...prevState,
        milestones: newMilestones,
      }));

      let updatedMilestoneState = { ...allMilestones };
      delete updatedMilestoneState[id];
      setAllMilestones(updatedMilestoneState);
    }
  };

  const updateHighlights = () => {
    setSaving((prev) => ({ ...prev, loading: true }));
    const ids = Object.keys(hasChanges).filter((id) => hasChanges[id]);

    ids.forEach((id) => addHighlight(id));
    setSaving((prev) => ({ ...prev, loading: false, profile: true }));
  };

  const onTogglePublic = async () => {
    setSaving((prev) => ({ ...prev, loading: true }));
    await togglePublicProfile();
    setSaving((prev) => ({ ...prev, loading: false, public: true }));
  };

  return (
    <>
      <H5 className="w-100 text-left" mode={mode} text="Highlights" bold />
      <P2
        className="w-100 text-left"
        mode={mode}
        text="Highlight what you've done in the past."
      />
      {Object.keys(allMilestones)
        .sort(sortAllMilestoneKeys)
        .map((currentMilestone, index) => (
          <HighlightForm
            key={`milestone-list-${allMilestones[currentMilestone].id}`}
            highlight={allMilestones[currentMilestone]}
            changeAttribute={(attribute, value) =>
              changeAttribute(currentMilestone, attribute, value)
            }
            showAddNew={index == 0}
            mode={mode}
            mobile={mobile}
            removeHighlight={removeHighlight}
            addHighlight={() => addHighlight("new")}
            validationErrors={
              validationErrors[allMilestones[currentMilestone].id]
            }
          />
        ))}
      {mobile && (
        <>
          <div className="d-flex flex-row justify-content-between w-100 my-3">
            <div className="d-flex flex-column">
              <Caption text="PREVIOUS" />
              <div
                className="text-grey cursor-pointer"
                onClick={() => changeTab("About")}
              >
                <ArrowLeft color="currentColor" /> About
              </div>
            </div>
            <div className="d-flex flex-column">
              <Caption text="NEXT" />
              <div
                className="text-grey cursor-pointer"
                onClick={() => changeTab("Goal")}
              >
                Goal <ArrowRight color="currentColor" />
              </div>
            </div>
          </div>
          <div className={`divider ${mode} my-3`}></div>
        </>
      )}
      <div
        className={`d-flex flex-row ${
          mobile ? "justify-content-between" : "justify-content-end"
        } w-100`}
      >
        {mobile && (
          <LoadingButton
            onClick={() => onTogglePublic()}
            type={publicButtonType}
            disabled={disablePublicButton || saving["loading"]}
            mode={mode}
            loading={saving["loading"]}
            success={saving["public"]}
            className="ml-auto mr-3"
          >
            {props.talent.public ? "Public" : "Publish Profile"}
          </LoadingButton>
        )}
        <LoadingButton
          onClick={() => updateHighlights()}
          type="white-subtle"
          mode={mode}
          disabled={saving["loading"]}
          loading={saving["loading"]}
          success={saving["profile"]}
          className="text-black"
        >
          Save Profile
        </LoadingButton>
      </div>
    </>
  );
};

export default Highlights;
