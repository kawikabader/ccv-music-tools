## Relevant Files

* `src/components/MusicianList/MusicianList.tsx` - Main musician list component that needs selection functionality
* `src/components/MusicianList/MusicianList.test.tsx` - Unit tests for musician list component
* `src/hooks/useClipboard.ts` - Custom hook for clipboard management functionality
* `src/hooks/useClipboard.test.ts` - Unit tests for clipboard hook
* `src/hooks/useMultiSelect.ts` - Custom hook for managing multiple selection state
* `src/hooks/useMultiSelect.test.ts` - Unit tests for multi-select hook
* `src/components/UI/CopyConfirmation.tsx` - Component for showing copy confirmation feedback
* `src/components/UI/CopyConfirmation.test.tsx` - Unit tests for copy confirmation component
* `src/utils/phoneFormatter.ts` - Utility function for formatting phone numbers for Apple Messages
* `src/utils/phoneFormatter.test.ts` - Unit tests for phone formatter utility

### Notes

* Unit tests should be placed alongside the code files they are testing
* Use `npm test` to run all tests
* Ensure clipboard functionality works across major browsers
* Focus on Apple Messages compatibility for phone number formatting

## Tasks

* [x] 1.0 Implement selection state management system
  + [x] 1.1 Create `useMultiSelect` custom hook to manage selected musician IDs
  + [x] 1.2 Implement `toggleSelection` function to add/remove musicians from selection
  + [x] 1.3 Implement `isSelected` function to check if a musician is currently selected
  + [x] 1.4 Add `clearSelection` function to reset all selections
  + [x] 1.5 Ensure selection state doesn't persist between page refreshes
* [x] 2.0 Add visual selection indicators to musician list
  + [x] 2.1 Modify `MusicianList` component to accept selection state and handlers
  + [x] 2.2 Add click handlers to musician list items for selection toggling
  + [x] 2.3 Implement visual selection styles (highlighted background, checkmark, or border)
  + [x] 2.4 Ensure selection indicators are accessible with proper ARIA attributes
  + [x] 2.5 Make selection work on both desktop and mobile (touch-friendly)
  + [x] 2.6 Add keyboard navigation support (Space/Enter to toggle selection)
* [ ] 3.0 Create clipboard management functionality
  + [ ] 3.1 Create `useClipboard` custom hook using modern Clipboard API
  + [ ] 3.2 Implement `phoneFormatter` utility to format numbers for Apple Messages
  + [ ] 3.3 Create function to update clipboard with comma-separated phone numbers
  + [ ] 3.4 Handle dynamic clipboard updates when musicians are selected/deselected
  + [ ] 3.5 Add error handling for clipboard API failures
  + [ ] 3.6 Ensure browser compatibility fallbacks for older browsers
* [ ] 4.0 Implement copy confirmation feedback
  + [ ] 4.1 Create `CopyConfirmation` component for visual feedback
  + [ ] 4.2 Design toast/notification styling that fits existing design system
  + [ ] 4.3 Integrate confirmation component with clipboard operations
  + [ ] 4.4 Add auto-dismiss functionality for confirmation messages
  + [ ] 4.5 Ensure confirmation works on both successful copies and errors
* [ ] 5.0 Write comprehensive tests and ensure accessibility
  + [ ] 5.1 Write unit tests for `useMultiSelect` hook
  + [ ] 5.2 Write unit tests for `useClipboard` hook
  + [ ] 5.3 Write unit tests for `phoneFormatter` utility
  + [ ] 5.4 Write integration tests for `MusicianList` selection functionality
  + [ ] 5.5 Write tests for `CopyConfirmation` component
  + [ ] 5.6 Test keyboard navigation and screen reader compatibility
  + [ ] 5.7 Test clipboard functionality across different browsers
  + [ ] 5.8 Add performance tests for rapid selection/deselection 
