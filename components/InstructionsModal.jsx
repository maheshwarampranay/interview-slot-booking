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
      <AlertDialogContent className="max-w-xs sm:max-w-md md:max-w-2xl p-4 sm:p-6">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg sm:text-xl md:text-2xl">
            COSC Recruitments - Interview Slot Selection Guide
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3 sm:space-y-4">
            <p className="text-xs sm:text-sm">
              Please read these instructions carefully before selecting your slot:
            </p>
            
            <div className="mt-2 sm:mt-4 space-y-2">
              <p className="font-medium text-black text-sm sm:text-base">
                Important Information:
              </p>
              <ul className="list-disc pl-4 sm:pl-6 space-y-1 text-xs sm:text-sm">
                <li>Slots are assigned on first-come, first-served basis.</li>
                <li>An individual can book the slot only once.</li>
                <li>The interview will be conducted online.</li>
                <li>Please be ready 5 minutes before your interview starts.</li>
                <li>Once a slot is booked, it cannot be changed. So, please make sure you book the slot in your available time.</li>
              </ul>
            </div>

            <div className="mt-2 sm:mt-4">
              <p className="font-medium text-black mb-2 text-sm sm:text-base">
                Slot Color Guide:
              </p>
              <div className="space-y-2 sm:space-y-3">
  <div className="flex items-center space-x-2 sm:space-x-3">
    <div className="flex-shrink-0 w-24 sm:w-36">
      <Button 
        className="w-full cursor-default 
          bg-purple-600 hover:bg-purple-600 
          text-xs sm:text-sm 
          p-1.5 sm:p-2 
          flex items-center justify-center"
      >
        <span className="truncate">09:40 AM to 10:30 AM</span>
      </Button>
    </div>
    <span className="text-xs sm:text-sm text-black flex-grow">
      Available for booking
    </span>
  </div>
  <div className="flex items-center space-x-2 sm:space-x-3">
    <div className="flex-shrink-0 w-24 sm:w-36">
      <Button 
        disabled
        className="w-full cursor-default 
          bg-gray-300 hover:bg-gray-300 
          text-gray-700 
          text-xs sm:text-sm 
          p-1.5 sm:p-2 
          flex items-center justify-center"
      >
        <span className="truncate">10:30 AM to 11:20 AM</span>
      </Button>
    </div>
    <span className="text-xs sm:text-sm text-black flex-grow">
      Already scheduled
    </span>
  </div>
</div>
            </div>

            <div className="mt-2 sm:mt-4">
              <p className="font-medium text-black mb-2 text-sm sm:text-base">
                Additional Notes:
              </p>
              <ul className="list-disc pl-4 sm:pl-6 space-y-1 text-xs sm:text-sm">
                <li>Once a slot is booked, it cannot be changed</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2 sm:mt-4">
          <AlertDialogAction 
            onClick={onClose} 
            className="bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm p-2 sm:p-3"
          >
            I Understand
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default InstructionsModal;