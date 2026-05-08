import { Button } from "@/components/ui/button";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot
} from "@/components/ui/input-otp";
import { changeCurrentStage, coachfirstTimeRegistration } from "@/config/state-reducers/login";
import { sendData } from "@/lib/api";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { useAppDispatch } from "@/providers/global/hooks";
import { store } from "@/providers/global/slices/coach";
import { MoveLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

export default function InputOTPContainer() {
  const {
    isFirstTime,
    mobileNumber,
    otp,
    dispatch,
    user
  } = useCurrentStateContext();

  const dispatchRedux = useAppDispatch();

  const router = useRouter();
  const isVerifyingRef = useRef(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const verifyOtp = useCallback(async () => {
    if (isVerifyingRef.current || isVerified) return; // Prevent duplicate verification calls
    if (otp.length !== 4) return; // Only verify if OTP is complete
    
    isVerifyingRef.current = true;
    setIsVerifying(true);
    try {
      const data = {
        mobileNumber,
        otp
      }
      const response = await sendData("app/verifyOtp", data);
      if (response.status_code !== 200 || response.success === false) {
        throw new Error(response.error || response.message || "OTP verification failed");
      }
      toast.success(response.message);
      setIsVerified(true);

      const verifiedUser = response?.data?.user || user;
      const refreshToken = verifiedUser?.refreshToken;
      const userId = verifiedUser?._id;
      if (!refreshToken || !userId) {
        throw new Error("Missing login token. Please request OTP again.");
      }

      const authHeaderResponse = await fetch("/api/login", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          refreshToken,
          _id: userId,
          userType: "coach"
        })
      })
      const authHeaderData = await authHeaderResponse.json()
      if (authHeaderData.status_code !== 200) throw new Error(authHeaderData.message);
      dispatchRedux(store({ ...verifiedUser, refreshToken }));

      if (isFirstTime) {
        dispatch(coachfirstTimeRegistration(verifiedUser.coachId));
        return;
      } else {
        router.push("/coach/dashboard");
      }
    } catch (error) {
      setIsVerified(false);
      toast.error(error.message || "Please try again Later!");
    } finally {
      isVerifyingRef.current = false;
      setIsVerifying(false);
    }
  }, [otp, mobileNumber, user, isFirstTime, dispatch, dispatchRedux, router, isVerified]);

  async function resendOtp() {
    try {
      if (mobileNumber.length !== 10) throw new Error("Mobile number should be 10 digits longer!");
      const data = {
        credential: "+91" + mobileNumber,
        fcmToken: ""
      }
      const response = await sendData("app/signin?authMode=mob&clientType=web", data);
      if (response.status_code !== 200 || response.success === false) {
        throw new Error(response.error || response.message || "Failed to resend OTP");
      }
      dispatch({
        type: "UPDATE_CURRENT_STATE",
        payload: {
          stage: 2,
          user: response.data?.user
        }
      });
      setIsVerified(false);
      toast.success("OTP sent successfully!");
    } catch (error) {
      toast.error(error.message || " Please try again Later!")
    }
  }

  return <div>
    <h3 className="text-[32px] leading-[1]">Enter OTP</h3>
    <button
      onClick={() => dispatch(changeCurrentStage(1))}
      className="mb-4 flex items-center gap-1"
    >
      <MoveLeft size={20} />
      <p>Back</p>
    </button>
    <p className="text-[var(--dark-1)]/25 text-[14px] mb-8">
      <span>Enter 4-Digit OTP sent on </span>
      <span className="text-black">+91 {mobileNumber}</span>
    </p>
    <InputOTP
      maxLength={4}
      value={otp}
      onChange={(value) => dispatch({ type: "UPDATE_OTP", payload: value })}
      onKeyDown={(e) => {
        if (e.key === "Enter" && otp.length === 4 && !isVerifyingRef.current && !isVerified) {
          e.preventDefault();
          verifyOtp();
        }
      }}
    >
      <InputOTPGroup>
        {Array.from({ length: 4 }, (_, i) => i).map(index => <InputOTPSlot
          index={index}
          key={index}
          className="h-[48px] w-[48px] bg-[var(--comp-1)] focus:outline-none data-[active=true]:ring-0 !rounded-[10px] mr-2 border-1"
        />)}
      </InputOTPGroup>
    </InputOTP>
    <div className="text-[14px] mt-4 flex items-center gap-1">
      <p className="text-[var(--dark-1)]/50">Didn&apos;t receive an OTP?</p>
      <button
        className="font-bold"
        onClick={resendOtp}
      >
        Resend OTP
      </button>
    </div>
    <Button
      variant="wz"
      size="lg"
      className="block px-12 mx-auto mt-10"
      onClick={verifyOtp}
      disabled={otp.length !== 4 || isVerifying || isVerified}
    >
      Sign In
    </Button>
  </div>
}
