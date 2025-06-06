# PRD: Multiple Phone Number Copy Feature

## Introduction/Overview

This feature enables music directors to efficiently select multiple musicians from the roster and copy their phone numbers to the clipboard in a format optimized for Apple Messages. The goal is to eliminate the tedious process of individually messaging multiple musicians by allowing directors to quickly create group text conversations for rehearsals, gigs, emergencies, and general announcements.

## Goals

1. **Streamline Communication**: Reduce the time needed to initiate group text conversations with multiple musicians
2. **Improve Workflow Efficiency**: Enable music directors to quickly organize group communications directly from the roster view
3. **Maintain Simple UX**: Integrate seamlessly into the existing musician list page without cluttering the interface
4. **Ensure Apple Messages Compatibility**: Format phone numbers correctly for automatic group conversation creation in Apple Messages

## User Stories

* **As a music director**, I want to select multiple musicians from the roster so that I can quickly copy their phone numbers and start a group text message
* **As a music director**, I want to see visual feedback when musicians are selected so that I know which numbers will be copied
* **As a music director**, I want to easily add or remove musicians from my selection so that I can adjust the group as needed
* **As a music director**, I want confirmation when numbers are copied so that I know the action was successful
* **As a music director**, I want to paste the copied numbers directly into Apple Messages so that I can immediately start a group conversation

## Functional Requirements

1. **Selection Mechanism**: The system must allow users to click on musicians in the roster to toggle their selection state
2. **Visual Indicators**: The system must provide clear visual feedback showing which musicians are currently selected (e.g., highlighted background, checkmark, border change)
3. **Dynamic Clipboard Management**: 
   - When a musician is selected, their phone number must be added to the clipboard
   - When a musician is deselected, their phone number must be removed from the clipboard
   - Previously selected numbers must remain in the clipboard
4. **Apple Messages Format**: The system must format phone numbers as comma-separated values without additional text (e.g., "555-1234, 555-5678, 555-9012")
5. **Copy Confirmation**: The system must provide visual confirmation when phone numbers are successfully copied to the clipboard
6. **Session Isolation**: The system must not persist selections between page refreshes or sessions
7. **Real-time Updates**: The clipboard content must update immediately upon selection/deselection without requiring a separate "copy" action

## Non-Goals (Out of Scope)

* Select All / Clear All functionality
* Preview area showing current clipboard content
* Including musician names in the copied format
* Remembering selections between sessions
* Creating a separate contact/messaging page
* Setting maximum limits on selection count
* Integration with messaging platforms other than Apple Messages

## Design Considerations

* **Integration**: Feature must integrate into the existing musician list page without disrupting current layout
* **Visual Hierarchy**: Selection indicators should be prominent but not overwhelming
* **Accessibility**: Selection states must be keyboard accessible and screen reader friendly
* **Mobile Responsiveness**: Selection mechanism must work effectively on both desktop and mobile devices

## Technical Considerations

* **Clipboard API**: Utilize the modern Clipboard API for reliable cross-browser clipboard management
* **State Management**: Implement efficient state management for tracking selected musicians and updating clipboard content
* **Phone Number Formatting**: Ensure consistent phone number formatting that Apple Messages can parse correctly
* **Performance**: Optimize for smooth interactions when selecting/deselecting multiple musicians rapidly
* **Browser Compatibility**: Ensure clipboard functionality works across major browsers used by music directors

## Success Metrics

* **Usage Adoption**: Track how frequently the feature is used compared to individual musician contact actions
* **Time Savings**: Measure reduction in time spent initiating group communications
* **User Satisfaction**: Gather feedback on workflow improvement from music directors
* **Error Rate**: Monitor clipboard copy failures and selection state inconsistencies

## Open Questions

1. Should the selection state be visually distinct enough to be noticeable but subtle enough not to interfere with reading musician information?
2. What specific visual treatment (highlight color, checkmarks, borders) would best fit the existing design system?
3. Should there be any rate limiting on clipboard updates to prevent potential performance issues with rapid selection changes? 
