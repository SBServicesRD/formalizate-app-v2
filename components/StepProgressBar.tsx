
import React from 'react';
import { AppStep } from '../types';

interface StepProgressBarProps {
    currentStep: AppStep;
    highestStepReached: AppStep;
    goToStep: (step: AppStep) => void;
}

const StepProgressBar: React.FC<StepProgressBarProps> = ({ currentStep, highestStepReached, goToStep }) => {
    // Mapping internal AppSteps to visual steps
    // Assuming StepTypeSelection is Step 1 for the user
    
    const visualSteps = [
        { id: AppStep.StepTypeSelection, label: 'Estructura' },
        { id: AppStep.StepA, label: 'Identidad' },
        { id: AppStep.Payment, label: 'Activación' },
    ];

    // Calculate progress percentage
    // Simple logic: Find index of current step in visualSteps.
    // Note: If we are in intermediate steps (like StepB, StepC, Summary), map them to these parents.
    
    let activeIndex = visualSteps.findIndex(s => s.id === currentStep);
    
    // Fallback for intermediate steps
    if (currentStep > AppStep.StepTypeSelection && currentStep < AppStep.StepA) activeIndex = 0;
    if (currentStep > AppStep.StepA && currentStep < AppStep.Payment) activeIndex = 1; // Covers Summary
    if (currentStep === AppStep.Summary) activeIndex = 1.5; // Visual trick: halfway between Identity and Payment
    if (currentStep >= AppStep.Payment) activeIndex = 2;

    // Special visual handling for Summary
    // If we are on Summary, we want the bar to be almost at Payment but not quite.
    const isSummary = currentStep === AppStep.Summary;
    const calculatedIndex = isSummary ? 1.8 : activeIndex; // 1.8 simulates "almost there"

    const progressPercentage = ((calculatedIndex) / (visualSteps.length - 1)) * 100;

    return (
        <div className="w-full mb-12 px-4">
            {/* Labels Top */}
             <div className="flex justify-between mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                {visualSteps.map((step, index) => (
                    <span key={step.id} className={`${index <= Math.floor(calculatedIndex) ? 'text-sbs-blue' : ''}`}>
                        {step.label}
                    </span>
                ))}
            </div>

            {/* Linear Bar Container */}
            <div className="relative h-2 bg-gray-100 rounded-full w-full overflow-hidden">
                 {/* Filled Bar */}
                <div 
                    className="absolute top-0 left-0 h-full bg-sbs-blue transition-all duration-700 ease-out rounded-full"
                    style={{ width: `${progressPercentage}%` }}
                ></div>
            </div>

            {/* Points on the line */}
            <div className="relative -top-3 flex justify-between w-full">
                {visualSteps.map((step, index) => {
                     const isActive = index <= calculatedIndex;
                     const isCurrent = index === Math.floor(calculatedIndex) && !isSummary;
                     
                     return (
                        <div 
                            key={step.id} 
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-500 ${isActive ? 'bg-sbs-blue border-sbs-blue' : 'bg-white border-gray-200'} ${isCurrent ? 'ring-4 ring-blue-100' : ''}`}
                        />
                     )
                })}
            </div>
        </div>
    );
};

export default StepProgressBar;
