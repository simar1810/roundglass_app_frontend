import FormControl from "@/components/FormControl";
import { Button } from "@/components/ui/button";
import { sendData } from "@/lib/api";
import useCurrentStateContext from "@/providers/CurrentStateContext";
import { toast } from "sonner";

export default function InputMobileNumber() {
  const { mobileNumber, dispatch } = useCurrentStateContext();

  async function sendOtp() {
    try {
      if (mobileNumber.length !== 10) throw new Error("Mobile number should be 10 digits longer!");
      const data = {
        credential: "+91" + mobileNumber,
        fcmToken: ""
      }
      const response = await sendData("app/signin?authMode=mob", data);
      if (response.status_code === 400) throw new Error(response.message);
      dispatch({
        type: "UPDATE_CURRENT_STATE",
        payload: {
          stage: 2,
          user: response.data.user
        }
      });
    } catch (error) {
      toast(error.message || " Please try again Later!")
    }
  }

  return <div>
    <h3 className="text-[32px] mb-4">Hi, Welcome</h3>
    <h5 className="mb-1">Ready to Inspire Wellness?</h5>
    <p className="text-[var(--dark-1)]/25 text-[14px] mb-8">Signup or Login Now to Transform</p>
    <FormControl
      label="Mobile Number"
      className="w-full"
      type="tel"
      placeholder="Enter Mobile Number"
      value={mobileNumber}
      onChange={e => dispatch({
        type: "UPDATE_MOBILE_NUMBER",
        payload: e.target.value
      })}
    />
    <Button
      variant="wz"
      size="lg"
      className="block px-12 mx-auto mt-10"
      onClick={sendOtp}
    >
      OTP
    </Button>
  </div>
}