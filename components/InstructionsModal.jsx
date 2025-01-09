import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function InstructionsModal({ isOpen, onClose }) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Interview Slot Selection Guide</AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            <p>Please read these instructions carefully before selecting your interview slot:</p>
            
            <div className="mt-4 space-y-2">
              <p className="font-medium text-black">Important Information:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Slots are assigned on a first-come, first-served basis</li>
                <li>Once confirmed, your slot selection cannot be changed</li>
                <li>You must join your panel&apos;s WhatsApp group after scheduling</li>
                <li>Please be online 5 minutes before your scheduled time</li>
              </ul>
            </div>

            <div className="mt-4">
              <p className="font-medium text-black mb-2">Slot Color Guide:</p>
              <div className="grid gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-24">
                    <Button 
                      className="bg-purple-600 hover:bg-purple-600 w-full cursor-default" 
                      
                    >
                      10:00
                    </Button>
                  </div>
                  <span className="text-black">Available for scheduling</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24">
                    <Button 
                      className="bg-gray-300 hover:bg-gray-300 w-full cursor-default text-gray-700" 
                      disabled
                    >
                      10:30
                    </Button>
                  </div>
                  <span className="text-black">Already scheduled by others</span>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction 
            onClick={onClose} 
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            I Understand
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default InstructionsModal;