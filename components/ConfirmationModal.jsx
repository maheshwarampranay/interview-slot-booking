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
      <AlertDialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white text-xl font-bold uppercase tracking-wider">
            Confirm Your Interview Slot
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#D8D6E9]">
            Are you sure you want to book the following slot for your interview:
            <div className="mt-4 p-4 bg-gradient-to-r from-[#5B3BE1] to-[#C38BFF] rounded-xl text-white font-medium">
              {new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} | {time}
            </div>
            <div className="mt-4 text-sm text-[#D8D6E9]">
              Reminder: you can give your interview only during this slot.
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={onCancel} 
            className="bg-transparent border border-white/30 text-white hover:bg-white/10"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            className="bg-gradient-to-r from-[#5B3BE1] to-[#C38BFF] hover:from-[#4A2BC8] hover:to-[#B028FF] text-white border-0"
          >
            Confirm Slot
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}