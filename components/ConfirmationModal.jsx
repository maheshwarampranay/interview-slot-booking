//confirmation modal.jsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function ConfirmationModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  date, 
  time 
}) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm Your Interview Slot</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to book the following slot for your interview:
            <div className="mt-2 text-black font-medium">
              {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | {time}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Reminder: you can give your interview only during this slot.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-purple-600 hover:bg-purple-700">
            Confirm Slot
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}