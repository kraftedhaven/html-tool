/**
 * User Onboarding Component
 * Guides new users through the SaaS platform features
 */

import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action?: string;
  actionCallback?: () => void;
}

export const UserOnboarding: React.FC = () => {
  const { user, subscription } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: `Welcome to Neural Listing Engine, ${user?.firstName}!`,
      description: 'You\'re now part of the most advanced AI-powered listing platform for resellers. Let\'s get you started.',
      icon: '🎉'
    },
    {
      id: 'subscription',
      title: 'Your Subscription is Active',
      description: `You're on the ${subscription?.planDetails.name} plan with ${subscription?.planDetails.features.monthlyListingLimit === -1 ? 'unlimited' : subscription?.planDetails.features.monthlyListingLimit} listings per month.`,
      icon: '✅'
    },
    {
      id: 'features',
      title: 'Explore Your Features',
      description: 'Access AI image analysis, multi-marketplace posting, and advanced analytics from your dashboard.',
      icon: '🚀',
      action: 'View Features',
      actionCallback: () => {
        // Could navigate to features overview
        console.log('Navigate to features');
      }
    },
    {
      id: 'engine',
      title: 'Try the Neural Listing Engine',
      description: 'Upload your first product images and see the AI magic in action. Generate optimized listings in seconds.',
      icon: '🧠',
      action: 'Open Engine',
      actionCallback: () => {
        // Could navigate to the main engine
        console.log('Navigate to engine');
      }
    },
    {
      id: 'support',
      title: 'Need Help?',
      description: 'Access our comprehensive guides, video tutorials, and priority support whenever you need assistance.',
      icon: '💬',
      action: 'Get Support',
      actionCallback: () => {
        window.open('mailto:support@hiddenhaven.com', '_blank');
      }
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsVisible(false);
      localStorage.setItem('onboardingCompleted', 'true');
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('onboardingCompleted', 'true');
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Don't show if user has completed onboarding
  if (!isVisible || localStorage.getItem('onboardingCompleted')) {
    return null;
  }

  const step = onboardingSteps[currentStep];

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-header">
          <div className="step-indicator">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`step-dot ${index <= currentStep ? 'active' : ''}`}
              />
            ))}
          </div>
          <button className="skip-btn" onClick={handleSkip}>
            Skip Tour
          </button>
        </div>

        <div className="onboarding-content">
          <div className="step-icon">{step.icon}</div>
          <h3>{step.title}</h3>
          <p>{step.description}</p>

          {step.action && step.actionCallback && (
            <button
              className="action-btn-onboarding"
              onClick={step.actionCallback}
            >
              {step.action}
            </button>
          )}
        </div>

        <div className="onboarding-footer">
          <button
            className="nav-btn secondary"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            Previous
          </button>

          <span className="step-counter">
            {currentStep + 1} of {onboardingSteps.length}
          </span>

          <button
            className="nav-btn primary"
            onClick={handleNext}
          >
            {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};