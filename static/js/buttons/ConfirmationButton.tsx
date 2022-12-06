import React, { FC, MouseEvent } from "react";
import ConfirmationModal from "../modals/ConfirmationModal";
import { Button } from "@canonical/react-components";
import usePortal from "react-useportal";

interface Props {
  isLoading: boolean;
  iconClass: string;
  title: string;
  confirmationMessage: string;
  posButtonLabel: string;
  onConfirm: () => void;
  isDisabled?: boolean;
}

const ConfirmationButton: FC<Props> = ({
  isLoading,
  iconClass,
  title,
  confirmationMessage,
  posButtonLabel,
  onConfirm,
  isDisabled = false,
}) => {
  const { openPortal, closePortal, isOpen, Portal } = usePortal();

  const handleConfirmModal = () => {
    closePortal();
    onConfirm();
  };

  const handleShiftClick = (e: MouseEvent<HTMLElement>) => {
    if (e.shiftKey) {
      onConfirm();
    } else {
      openPortal();
    }
  };

  return (
    <>
      {isOpen && (
        <Portal>
          <ConfirmationModal
            title={title}
            onClose={closePortal}
            confirmationMessage={confirmationMessage}
            posButtonLabel={posButtonLabel}
            onConfirm={handleConfirmModal}
          />
        </Portal>
      )}
      <Button dense disabled={isDisabled} onClick={handleShiftClick}>
        <i
          className={
            isLoading ? "p-icon--spinner u-animation--spin" : iconClass
          }
        >
          Delete
        </i>
      </Button>
    </>
  );
};

export default ConfirmationButton;