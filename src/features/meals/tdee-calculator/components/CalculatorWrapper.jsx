"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";

import CalculatorContainer from "./CalculatorContainer";

export default function CalculatorWrapper() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-tl from-[var(--accent-1)] to-green-600 font-bold">
          TDEE Calculator
        </Button>
      </DialogTrigger>

      <CalculatorContainer />
    </Dialog>
  );
}