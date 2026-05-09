import ComponentCard from "../../common/ComponentCard";
import Switch from "../switch/Switch";

export default function ToggleSwitch() {
  return (
    <ComponentCard title="Toggle switch input">
      <div className="flex gap-4">
        <Switch
          label="Default"
          defaultChecked={true}
        />
        <Switch
          label="Checked"
          defaultChecked={true}
        />
        <Switch label="Disabled" disabled={true} />
      </div>{" "}
      <div className="flex gap-4">
        <Switch
          label="Default"
          defaultChecked={true}
          color="gray"
        />
        <Switch
          label="Checked"
          defaultChecked={true}
          color="gray"
        />
        <Switch label="Disabled" disabled={true} color="gray" />
      </div>
    </ComponentCard>
  );
}
