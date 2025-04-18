import { AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { onChangeOTP } from "@/config/state-reducers/clubsystem";
import { sendData } from "@/lib/api";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import Image from "next/image";
import { useRef } from "react";
import { toast } from "sonner";

export default function ClubSystemConfirmation({ clubSystem }) {
  const {
    otp,
    dispatch
  } = useCurrentStateContext();

  const alertClose = useRef();

  async function confirmationClusSystemChange() {
    try {
      const data = {
        clubSystem: clubSystem.id,
        otp
      }
      const response = await sendData("verifyOtpToUpdateClubSystem", data);
      if (!response.sucess) throw new Error(response.message || response.error);
      toast.success(response.message);
      alertClose.current.click();
    } catch (error) {
      toast.error(error.message);
    }
  }

  return <AlertDialogContent className="border-2 border-[var(--dark-1)]/25">
    <AlertDialogHeader>
      <Image
        src="/illustrations/club.svg"
        alt=""
        height={250}
        width={150}
        className="max-w-[250px] w-full mx-auto"
      />
      <AlertDialogTitle className="text-center mb-4">Enter the OTP Received on your Email ID</AlertDialogTitle>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <Input
        placeholder="Please enter your OTP"
        value={otp}
        onChange={e => dispatch(onChangeOTP(e.target.value))}
      />
      <AlertDialogCancel ref={alertClose}>Cancel</AlertDialogCancel>
      <Button variant="wz" onClick={confirmationClusSystemChange}>Confirm</Button>
    </AlertDialogFooter>
  </AlertDialogContent>
}