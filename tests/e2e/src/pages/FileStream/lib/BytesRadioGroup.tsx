export function BytesRadioGroup(props: {
  selectedValue: number;
  onChange: (value: number) => void;
}) {
  return (
    <p>
      <BytesRadioInput
        label="1KB"
        value={1e3}
        selectedValue={props.selectedValue}
        onChange={props.onChange}
      />
      <BytesRadioInput
        label="10KB"
        value={1e4}
        selectedValue={props.selectedValue}
        onChange={props.onChange}
      />
      <BytesRadioInput
        label="100KB"
        value={1e5}
        selectedValue={props.selectedValue}
        onChange={props.onChange}
      />
      <BytesRadioInput
        label="150KB"
        value={1e5 + 5e4}
        selectedValue={props.selectedValue}
        onChange={props.onChange}
      />
      <BytesRadioInput
        label="200KB"
        value={2e6}
        selectedValue={props.selectedValue}
        onChange={props.onChange}
      />
      <BytesRadioInput
        label="500KB"
        value={5e6}
        selectedValue={props.selectedValue}
        onChange={props.onChange}
      />
      <BytesRadioInput
        label="1MB"
        value={1e6}
        selectedValue={props.selectedValue}
        onChange={props.onChange}
      />
      <BytesRadioInput
        label="10MB"
        value={1e7}
        selectedValue={props.selectedValue}
        onChange={props.onChange}
      />
    </p>
  );
}
function BytesRadioInput(props: {
  label: string;
  value: number;
  selectedValue: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <input
        type="radio"
        name="bytes"
        value={props.value}
        checked={props.value === props.selectedValue}
        onChange={() => props.onChange(props.value)}
      />
      {props.label}
    </label>
  );
}
