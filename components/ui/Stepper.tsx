"use client";

/* Stepper — pink-pixel theme.
   Simplified from React Bits: dropped framer-motion AnimatePresence for the
   slide (was throwing removeChild errors in framer-motion v12). Uses CSS
   transitions instead — smoother, predictable, less prone to ref issues.
   Step indicators are pixel-block squares with magenta accents. */

import React, {
  Children,
  HTMLAttributes,
  ReactNode,
  useState,
} from "react";
import styles from "./Stepper.module.css";

type StepperProps = {
  children: ReactNode;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  onFinalStepCompleted?: () => void;
  backButtonText?: string;
  nextButtonText?: string;
  finalButtonText?: string;
  disableStepIndicators?: boolean;
} & HTMLAttributes<HTMLDivElement>;

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  backButtonText = "Back",
  nextButtonText = "Continue",
  finalButtonText = "Got it",
  disableStepIndicators = false,
  ...rest
}: StepperProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState(0);
  const stepsArray = Children.toArray(children);
  const totalSteps = stepsArray.length;
  const isLastStep = currentStep === totalSteps;

  const updateStep = (newStep: number) => {
    setCurrentStep(newStep);
    if (newStep > totalSteps) onFinalStepCompleted();
    else onStepChange(newStep);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      updateStep(currentStep - 1);
    }
  };
  const handleNext = () => {
    if (!isLastStep) {
      setDirection(1);
      updateStep(currentStep + 1);
    }
  };
  const handleComplete = () => {
    setDirection(1);
    updateStep(totalSteps + 1);
  };

  return (
    <div className={styles.outer} {...rest}>
      <div className={styles.indicatorRow}>
        {stepsArray.map((_, index) => {
          const stepNumber = index + 1;
          const isNotLast = index < totalSteps - 1;
          return (
            <React.Fragment key={stepNumber}>
              <StepIndicator
                step={stepNumber}
                currentStep={currentStep}
                disabled={disableStepIndicators}
                onClick={(n) => {
                  setDirection(n > currentStep ? 1 : -1);
                  updateStep(n);
                }}
              />
              {isNotLast && (
                <StepConnector isComplete={currentStep > stepNumber} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div className={styles.contentWrap}>
        <div
          key={currentStep}
          className={`${styles.slide} ${direction >= 0 ? styles.slideEnterRight : styles.slideEnterLeft}`}
        >
          {stepsArray[currentStep - 1]}
        </div>
      </div>

      <div
        className={`${styles.footer} ${currentStep !== 1 ? styles.footerSpread : styles.footerEnd}`}
      >
        {currentStep !== 1 && (
          <button
            type="button"
            onClick={handleBack}
            className={styles.backBtn}
          >
            {backButtonText}
          </button>
        )}
        <button
          type="button"
          onClick={isLastStep ? handleComplete : handleNext}
          className={styles.nextBtn}
        >
          {isLastStep ? finalButtonText : nextButtonText}
        </button>
      </div>
    </div>
  );
}

export function Step({ children }: { children: ReactNode }) {
  return <div className={styles.step}>{children}</div>;
}

function StepIndicator({
  step,
  currentStep,
  onClick,
  disabled,
}: {
  step: number;
  currentStep: number;
  onClick: (n: number) => void;
  disabled?: boolean;
}) {
  const status: "inactive" | "active" | "complete" =
    currentStep === step
      ? "active"
      : currentStep < step
        ? "inactive"
        : "complete";

  return (
    <button
      type="button"
      onClick={() => {
        if (step !== currentStep && !disabled) onClick(step);
      }}
      className={`${styles.indicator} ${styles[`indicator_${status}`]}`}
      style={disabled ? { pointerEvents: "none", opacity: 0.5 } : undefined}
      aria-current={status === "active" ? "step" : undefined}
      aria-label={`Step ${step}`}
    >
      {status === "complete" ? (
        <PixelCheck />
      ) : status === "active" ? (
        <span className={styles.activeBlock} />
      ) : (
        <span className={styles.stepNum}>{step}</span>
      )}
    </button>
  );
}

function StepConnector({ isComplete }: { isComplete: boolean }) {
  return (
    <div className={styles.connector}>
      <div
        className={`${styles.connectorFill} ${isComplete ? styles.connectorFillActive : ""}`}
      />
    </div>
  );
}

function PixelCheck() {
  const pixels: [number, number][] = [
    [0, 4], [0, 5],
    [1, 5], [1, 6],
    [2, 6], [2, 7],
    [3, 5], [3, 6],
    [4, 4], [4, 5],
    [5, 3], [5, 4],
    [6, 2], [6, 3],
    [7, 1], [7, 2],
  ];
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden
    >
      {pixels.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#000" />
      ))}
    </svg>
  );
}
