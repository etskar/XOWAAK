"use client";

import type { ReactNode } from "react";
import {
  Button as AriaButton,
  Checkbox as AriaCheckbox,
  FieldError as AriaFieldError,
  Input as AriaInput,
  Label as AriaLabel,
  ListBox,
  ListBoxItem,
  Popover,
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  Select as AriaSelect,
  SelectValue as AriaSelectValue,
  Switch as AriaSwitch,
  Text as AriaText,
  TextArea as AriaTextArea,
  TextField as AriaTextField,
  type CheckboxProps as AriaCheckboxProps,
  type InputProps as AriaInputProps,
  type RadioGroupProps as AriaRadioGroupProps,
  type RadioProps as AriaRadioProps,
  type SelectProps as AriaSelectProps,
  type SwitchProps as AriaSwitchProps,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";

import { cx } from "@/design-system/utils/cx";

type FieldContentProps = {
  label: string;
  description?: ReactNode;
  error?: ReactNode;
  className?: string;
};

function FieldMessages({ description, error }: Pick<FieldContentProps, "description" | "error">) {
  return (
    <>
      {description && (
        <AriaText slot="description" className="ds-field__description">
          {description}
        </AriaText>
      )}
      {error && <AriaFieldError className="ds-field__error">{error}</AriaFieldError>}
    </>
  );
}

export type InputProps = Omit<AriaTextFieldProps, "children" | "className" | "isInvalid"> &
  FieldContentProps & {
    placeholder?: string;
    inputClassName?: string;
    inputProps?: Omit<AriaInputProps, "className" | "placeholder">;
    isInvalid?: boolean;
  };

export function Input({
  label,
  description,
  error,
  placeholder,
  inputClassName,
  inputProps,
  isRequired,
  isDisabled,
  isInvalid,
  className,
  ...props
}: InputProps) {
  return (
    <AriaTextField
      {...props}
      className={cx("ds-field", className)}
      isDisabled={isDisabled}
      isInvalid={Boolean(error) || isInvalid}
      isRequired={isRequired}
    >
      <AriaLabel className="ds-field__label">
        {label}
        {isRequired && <span aria-hidden="true"> *</span>}
      </AriaLabel>
      <AriaInput
        {...inputProps}
        className={cx("ds-input", inputClassName)}
        placeholder={placeholder}
      />
      <FieldMessages description={description} error={error} />
    </AriaTextField>
  );
}

export type TextareaProps = Omit<AriaTextFieldProps, "children" | "className" | "isInvalid"> &
  FieldContentProps & {
    placeholder?: string;
    textareaClassName?: string;
    isInvalid?: boolean;
  };

export function Textarea({
  label,
  description,
  error,
  placeholder,
  textareaClassName,
  isRequired,
  isDisabled,
  isInvalid,
  className,
  ...props
}: TextareaProps) {
  return (
    <AriaTextField
      {...props}
      className={cx("ds-field", className)}
      isDisabled={isDisabled}
      isInvalid={Boolean(error) || isInvalid}
      isRequired={isRequired}
    >
      <AriaLabel className="ds-field__label">
        {label}
        {isRequired && <span aria-hidden="true"> *</span>}
      </AriaLabel>
      <AriaTextArea className={cx("ds-textarea", textareaClassName)} placeholder={placeholder} />
      <FieldMessages description={description} error={error} />
    </AriaTextField>
  );
}

export type SelectOption = {
  id: string;
  label: string;
  isDisabled?: boolean;
};

export type SelectProps = Omit<
  AriaSelectProps<SelectOption>,
  "children" | "className" | "isInvalid"
> &
  FieldContentProps & {
    options: readonly SelectOption[];
    placeholder?: string;
    isInvalid?: boolean;
  };

export function Select({
  label,
  description,
  error,
  options,
  placeholder = "Select an option",
  isRequired,
  isDisabled,
  isInvalid,
  className,
  ...props
}: SelectProps) {
  return (
    <AriaSelect
      {...props}
      className={cx("ds-field", className)}
      isDisabled={isDisabled}
      isInvalid={Boolean(error) || isInvalid}
      isRequired={isRequired}
      placeholder={placeholder}
    >
      <AriaLabel className="ds-field__label">
        {label}
        {isRequired && <span aria-hidden="true"> *</span>}
      </AriaLabel>
      <AriaButton className="ds-select-trigger">
        <AriaSelectValue<SelectOption> className="ds-select-value" />
        <span aria-hidden="true" className="ds-select-chevron">
          ⌄
        </span>
      </AriaButton>
      <FieldMessages description={description} error={error} />
      <Popover className="ds-select-popover">
        <ListBox items={options} className="ds-listbox" aria-label={label}>
          {(item) => (
            <ListBoxItem
              id={item.id}
              textValue={item.label}
              isDisabled={item.isDisabled}
              className="ds-listbox-item"
            >
              {item.label}
            </ListBoxItem>
          )}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

export type CheckboxProps = Omit<AriaCheckboxProps, "children" | "className"> &
  FieldContentProps & {
    isInvalid?: boolean;
  };

export function Checkbox({
  label,
  description,
  error,
  className,
  isInvalid,
  ...props
}: CheckboxProps) {
  return (
    <div className={cx("ds-check-field", className)}>
      <AriaCheckbox {...props} isInvalid={Boolean(error) || isInvalid} className="ds-checkbox">
        {({ isSelected }) => (
          <>
            <span className="ds-checkbox__indicator" aria-hidden="true">
              {isSelected ? "✓" : ""}
            </span>
            <span className="ds-checkbox__label">{label}</span>
          </>
        )}
      </AriaCheckbox>
      {description && (
        <p className="ds-field__description ds-check-field__message">{description}</p>
      )}
      {error && <p className="ds-field__error ds-check-field__message">{error}</p>}
    </div>
  );
}

export type RadioGroupProps = Omit<AriaRadioGroupProps, "children" | "className"> &
  FieldContentProps & {
    children?: ReactNode;
  };

export function RadioGroup({
  label,
  description,
  error,
  className,
  children,
  ...props
}: RadioGroupProps) {
  return (
    <AriaRadioGroup
      {...props}
      className={cx("ds-radio-group", className)}
      isInvalid={Boolean(error)}
    >
      <AriaLabel className="ds-field__label">{label}</AriaLabel>
      {description && (
        <AriaText slot="description" className="ds-field__description">
          {description}
        </AriaText>
      )}
      <div className="ds-radio-group__options">{children}</div>
      {error && <AriaFieldError className="ds-field__error">{error}</AriaFieldError>}
    </AriaRadioGroup>
  );
}

export type RadioProps = Omit<AriaRadioProps, "children" | "className"> & {
  label: string;
  className?: string;
};

export function Radio({ label, className, ...props }: RadioProps) {
  return (
    <AriaRadio {...props} className={cx("ds-radio", className)}>
      {({ isSelected }) => (
        <>
          <span className="ds-radio__indicator" aria-hidden="true">
            {isSelected ? <span /> : null}
          </span>
          <span>{label}</span>
        </>
      )}
    </AriaRadio>
  );
}

export type SwitchProps = Omit<AriaSwitchProps, "children" | "className"> & {
  label: string;
  className?: string;
};

export function Switch({ label, className, ...props }: SwitchProps) {
  return (
    <AriaSwitch {...props} className={cx("ds-switch", className)}>
      {({ isSelected }) => (
        <>
          <span className="ds-switch__track" aria-hidden="true">
            <span className="ds-switch__thumb" data-selected={isSelected || undefined} />
          </span>
          <span>{label}</span>
        </>
      )}
    </AriaSwitch>
  );
}
