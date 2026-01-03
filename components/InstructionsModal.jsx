import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function InstructionsModal({ isOpen, onClose }) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-white/10 backdrop-blur-md border border-white/20 text-white max-w-xs sm:max-w-md md:max-w-2xl p-4 sm:p-6 animate-in fade-in slide-in-from-bottom-2 duration-300 animate-out fade-out slide-out-to-bottom-2 shadow-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-wider">
            Interview Slot Selection Guide
          </AlertDialogTitle>
          <p className="text-[#D8D6E9] text-sm sm:text-base mt-1">COSC Recruitments 2026</p>
        </AlertDialogHeader>
        <div className="text-[#D8D6E9] space-y-3 sm:space-y-4 overflow-y-auto max-h-96">
          <p className="text-xs sm:text-sm">
            Please read these instructions carefully before selecting your slot:
          </p>
          
          <div className="space-y-3">
            <p className="font-medium text-white text-sm sm:text-base">
              Important Information:
            </p>
            <ul className="list-disc pl-4 sm:pl-6 space-y-1 text-xs sm:text-sm text-[#D8D6E9]">
              <li>Slots are assigned on first-come, first-served basis.</li>
              <li>An individual can book the slot only once.</li>
              <li>The interview will be conducted online.</li>
              <li>Please be ready 5 minutes before your interview starts.</li>
              <li>Once a slot is booked, it cannot be changed. So, please make sure you book the slot in your available time.</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-white mb-2 text-sm sm:text-base">
              Slot Color Guide:
            </p>
            <div className="space-y-2 sm:space-y-3">
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
                <span className="text-xs sm:text-sm text-[#D8D6E9] flex-grow">
                  Already scheduled
                </span>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex-shrink-0 w-24 sm:w-36">
                  <Button 
                    className="w-full cursor-default bg-gradient-to-r from-[#5B3BE1] to-[#C38BFF] hover:from-[#5B3BE1] hover:to-[#C38BFF] text-white text-xs sm:text-sm p-1.5 sm:p-2 flex items-center justify-center"
                  >
                    <span className="truncate">09:40 AM to 10:30 AM</span>
                  </Button>
                </div>
                <span className="text-xs sm:text-sm text-[#D8D6E9] flex-grow">
                  Available for booking
                </span>
              </div>
            </div>
          </div>
        </div>
        <AlertDialogFooter className="mt-3 sm:mt-4">
          <AlertDialogAction 
            onClick={onClose} 
            className="bg-gradient-to-r from-[#5B3BE1] to-[#C38BFF] hover:from-[#4A2BC8] hover:to-[#B028FF] text-white text-xs sm:text-sm p-2 sm:p-3 border-0"
          >
            I Understand
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default InstructionsModal;