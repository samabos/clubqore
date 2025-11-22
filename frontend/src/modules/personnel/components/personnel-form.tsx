import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PersonnelFormProps } from "../types/component-types";
import BasicDetailsForm, {
  BasicDetailsData,
} from "@/components/forms/BasicDetailsForm";

export function PersonnelForm({
  isOpen,
  onOpenChange,
  formData,
  onFormDataChange,
  onSubmit,
  isEdit = false,
}: PersonnelFormProps) {
  const handleFieldChange = (
    field: keyof BasicDetailsData,
    value: string | number | boolean
  ) => {
    onFormDataChange({
      ...formData,
      [field]: value,
    });
  };

  // All personnel (both staff and team_manager) get the same fields
  const isPersonnelRole =
    formData.role === "team_manager" || formData.role === "staff";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl !w-[90vw] sm:!max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Team Member" : "Add New Team Member"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-6">
          <BasicDetailsForm
            formData={formData}
            onChange={handleFieldChange}
            showEmail={true}
            showAvatar={true}
            showRole={true}
            showAdditionalFields={isPersonnelRole}
            showNotificationSettings={!isEdit && isPersonnelRole}
            emailReadOnly={isEdit}
            requiredFields={["email", "firstName", "lastName"]}
            className="space-y-4"
          />
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl">
              {isEdit ? "Update Team Member" : "Add Team Member"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
