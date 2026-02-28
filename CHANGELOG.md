# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.16.2] - 2026-02-27

### Changed

- V1.16.1

### Fixed

- Add --yes flag to bump-version-changelog-commit for automatic confirmation

## [1.16.1] - 2026-02-27

### Changed

- V1.16.0

### Documentation

- Update TECHNICAL_DOCUMENTATION.md to include Kick platform support in overview and features
- Update AGENTS.md to include Kick platform support in project overview and features
- Add @retconned/kick-js dependency and update asar unpack settings
- Update HomePage to include Kick platform link in footer
- Update README files to include Kick platform support in features and descriptions
- Update AGENTS.md to include POLL_FONT_SIZE settings and increase autocomplete history limit
- Update technical documentation and enhance poll settings with customizable font size, duplicate validation, and extended autocomplete history
- Enhance poll feature with customizable results font size, increased autocomplete suggestions, and duplicate validation

## [1.16.0] - 2026-02-27

### Added

- Add results font size customization across poll components and update related interfaces
- Add UnifiedChatMessage interface and refactor related user entities to utilize it
- Enhance ConnectionModal with max height and overflow handling; remove unused language hook in PlatformSelector
- Add Kick platform connection support in Header component
- Add Kick platform support
- Increase countdown text size for better visibility in CountdownOverlay
- Add duplicate options validation and warning in PollSetup component
- Adjust maximum height of suggestions dropdown to improve visibility
- Implement per-option storage for recent poll options in localStorage
- Enhance AutocompleteInput and PollOptionCard for improved editing experience
- Increase maximum items for question and option history to 20
- Add AGENTS.md for AI coding agents context and project documentation
- Add prompt for updating documentation to reflect recent code changes

### Changed

- V1.15.0

### Documentation

- Update documentation prompt to include AGENTS.md
- Add stream end detection and update poll configuration options in README
- Enhance technical documentation with additional features and components details

## [1.15.0] - 2026-02-25

### Added

- Update footer version display to use dynamic application version
- Enhance ConnectionModal to manage visibility based on all selected platforms' connection status
- Add dynamic import path handling for youtubei.js in Electron environment
- Add flash animation for vote changes in PollOptionCard component
- Update PollSetup component to enhance toggle functionality with click events and improved styling
- Update Username component to handle userId and strip leading @ from uniqueId for display
- Centralize storage keys for consistency across components
- Add stream end notifications and connection tracking for TikTok and YouTube
- Add reconnection handling for TikTok, Twitch, and YouTube, including event emissions and toast notifications
- Add showBorder property to PollProfile and update auto-save logic in PollSetup
- Add hideBorderToggle prop and conditional rendering for border visibility in PollSetup
- Add AnimatedBorder component and integrate border visibility in PollSetup and PollResultsPage
- Add ignoreDeprecations option to TypeScript configuration for backend and frontend
- Implement chat relay and platform events handling for overlays
- Add platform selection toggles and update overlay messages for better user guidance
- Enhance member status checks and highlight classes in chat messages
- Update help message in Makefile to enhance visual presentation
- Update usage instructions for update-version script to include remote push option
- Add functionality to push commits and tags to remote after version bump

### Changed

- Improve visibility handling and structure in AnimatedBorder component
- Remove ignoreDeprecations option and update path aliases for consistency in TypeScript configurations
- Update omni-logo-video-intro.mp4 for improved quality
- V1.14.0

### Fixed

- Adjust max height of option suggestions dropdown for better visibility
- Increase poll update interval from 500ms to 2s for improved reliability
- Update button styles for TikTok, Twitch, and YouTube in ConnectionModal
- Ensure children are wrapped in a div when not visible and adjust layout in AnimatedBorder component
- Increase height of popup window in usePoll hook
- Adjust minimum height of results container in PollResultsPage

### Documentation

- Add Portuguese README for Omni LIVE Tools with features and setup instructions
- Update README to enhance branding and add additional technology badges
- Enhance ConnectionModal documentation to reflect new auto-close behavior and platform connection management
- Enhance connection modal to auto-close upon successful connections with manual close option
- Enhance technical documentation with Username component details and centralized constants for polls
- Enhance documentation with shared connection mode details and platform event handling
- Add shared connection mode and member highlighting to enhance overlay functionality
- Update technical documentation to include new OBS pop-out windows and versioning scripts
- Update README to enhance feature descriptions and add new functionalities

## [1.14.0] - 2026-02-23

### Added

- Enhance PollProfile to include timer; implement auto-save functionality for profile changes
- Add poll profiles functionality; implement profile management with localStorage support
- Update PollSetup layout to display options in three columns for better organization
- Implement AutocompleteInput component for enhanced user experience; integrate recent poll options functionality
- Update vote text styles in PollOptionCard for improved readability
- Add timestamp display to GiftCard component; improve layout structure
- Add YouTube video support in OBS overlay; update translations for connection messages
- Add internationalization support for OBS overlay messages and connection status
- Enhance GiftCard layout and styling; add OBS overlay translations for English and Portuguese; improve grid calculation in ChatPage
- Add toggle functionality for queue and gift visibility with localStorage persistence; update translations for new features
- Add OBS pop-out pages for chat, gifts, and queue; enhance ChatPage with broadcasting functionality
- Add internationalization support for gift details in GiftCard component
- Implement streak tracking for gifts with timeout handling
- Enhance GiftContainer with auto-scroll functionality and scroll indicator
- Update poll options to support 6 total options and adjust defaults

### Changed

- V1.13.0

### Fixed

- Extend onConfigUpdate to include fullOptionsConfig; update related components for improved configuration handling

## [1.13.0] - 2026-02-23

### Added

- Implement featured message overlay with socket communication and UI updates
- Add search functionality to chat container with filtering and localization support
- Add support for superchats in chat components and update ChatItem type
- Enhance chat item addition with auto-queue functionality for superchats
- Implement chat queue functionality with auto-scroll and queue management
- Add YouTube platform support across the application
- Add YouTube integration with connection handling and event forwarding
- Enhance Username component to support platform-specific profile URLs and styles
- Disable interaction on poll configuration and results sections when poll is running or countdown is active
- Add Footer component and integrate it into HomePage
- Implement inline editing for poll questions and options with double-click support
- Add a footer on Home Page
- Added select-none to the body to disable text selection app-wide
- Enhance poll setup button logic to include countdown state for disabling
- Display application version in header and define __APP_VERSION__ in Vite config
- Add auto-commit option for version and changelog updates in update-version script

### Changed

- Update PollOptionCard and PollQuestion tests for improved vote and percentage formatting
- Add shared types and enums for multi-platform support, including YouTube integration
- Remove ConnectionForm component and update exports accordingly
- Update STORAGE_KEY values for question and option history to use 'omni-live' prefix
- Update version to 1.12.0 and enhance changelog with new features and fixes

### Fixed

- Improve keyboard shortcut handling with case-insensitive matching and ref callbacks
- Adjust layout classes for responsive design in App and HomePage components
- Update input field disabled state logic and adjust vote display in PollOptionCard

### Documentation

- Update technical documentation to include featured message overlay and related features
- Update features section to include featured message overlay and pop-out window support
- Update main features section to include search/filter and SuperChat highlighting
- Add search/filter functionality and SuperChat highlighting to features list in README
- Update technical documentation to include message queue details in main features and chat page description
- Add message queue feature and smart auto-scroll functionality to README
- Update README to include YouTube Live support and features
- Update technical documentation to include YouTube Live support and related components
- Add comprehensive technical documentation for Omni LIVE Tools

## [1.12.0] - 2026-02-20

### Added

- Implement background keep-alive functionality to maintain animations and timers during screen sharing

### Changed

- Update version to 1.11.0 and enhance changelog with new features and fixes

## [1.11.0] - 2026-02-20

### Added

- Add click outside handlers for question and option dropdowns in PollSetup
- Implement option history management with load and save functionality
- Reduce poll options from 12 to 4 across components and update related configurations

### Changed

- Update version to 1.10.0 and enhance changelog with new features and fixes

## [1.10.0] - 2026-02-20

### Added

- Enhance HomePage with entrance animation and gradient effects for menu cards
- Remove ConnectionStatusBanner from ChatPage and PollPage components
- Add background gradient for Poll and PollResults pages
- Update styles for navigation and overlay pages with new gradients and background effects

### Changed

- Enhance ErrorBoundary tests by suppressing React error logging and adding AudioContext mock
- Rename public-react to dist-frontend
- Update version to 1.9.0 and enhance changelog with new features and fixes

### Documentation

- Update README to enhance feature descriptions and remove commented sections

## [1.9.0] - 2026-02-20

### Added

- Add bump-version-changelog target to update version and changelog
- Add changelog generation commands and update version script to support changelog updates
- Enhance connection stability checks in TikTok and Twitch wrappers
- Update HomePage component links for TikTok and Twitch
- Add dedicated styles for Connection Status Button in Header component
- Update LanguageSelector component with dropdown menu and styles
- Enhance Header component with animated navigation bar and new styles
- Add ConnectionStatusBanner component and integrate it into ChatPage and PollPage
- Update keyboard shortcuts to require Shift key for actions
- Update poll feature demo image and replace with new GIF
- Enhance README with new features including auto-reconnect, notification sounds, and improved OBS overlay support
- Add language selector to ConnectionModal and adjust layout for close button
- Add auto-reconnect functionality and UI indicator in ConnectionModal and PollPage
- Add connection modal and improve connection handling across pages
- Enhance multi-platform support in OBS overlay with Twitch integration and improved user interface
- Add target="_blank" to GitHub link in HomePage for external navigation
- Implement neon flicker glow hover effect for header navigation links
- Add .DS_Store to .gitignore for macOS compatibility
- Update omni logo video intro for enhanced visual experience
- Add useNotificationSound hook and integrate into usePollDisplay for notification sounds
- Add LoadScreen and update SplashScreen to use video; integrate into HomePage and PollResultsPage

### Changed

- Add initial changelog for project version history
- Clean up empty code change sections in the changes log
- Update version to 1.8.0 in package.json

### Fixed

- Infinite loop on internet disconnection

## [1.8.0] - 2026-02-19

### Added

- Add neon glow effects and shake animation for PollQuestion component

### Changed

- Update version to 1.7.0 in package.json

## [1.7.0] - 2026-02-19

### Added

- Add glitch animation for countdown "GO" text in CountdownOverlay component

### Changed

- Adjust margin for winner text and animation styles in SpotlightTrophyCelebration component
- Update sizeConfig properties for PollOptionCard component
- Enhance Makefile structure and command clarity
- Update version to 1.6.0 in package.json

## [1.6.0] - 2026-02-19

### Added

- Add version update commands and script for automatic versioning based on commit history

### Changed

- Streamline bump-version commands for consistency
- Rename version update commands for clarity and consistency

### Fixed

- Adjust line height for winner text in SpotlightTrophyCelebration component

## [1.5.0] - 2026-02-16

### Added

- Add hideStatusBarToggle prop to PollSetup and use it in PollResultsPage for conditional rendering
- Add size prop to PollResults and set default size in PollPage for improved layout control
- Integrate PollControlButtons into PollPage for improved control handling
- Add showStatusBar functionality to PollSetup and related components
- Enhance form layout for TikTok and Twitch connections with responsive design
- Implement scroll-based visibility toggle for header component
- Add PollStatusBar component and integrate it into PollResults for improved status display
- Update poll control button labels and remove variant prop for consistency
- Update keyboard shortcuts to require SHIFT modifier for starting, stopping, and resetting polls
- Enhance poll timer with timestamp-based calculations for accurate timing during window minimization
- Implement ErrorBoundary component and centralized error handling utilities
- Add poll-related types and constants for improved state management and configuration
- Add usePollSync and usePollTimer hooks for improved poll state management and synchronization
- Add DisconnectedModal component and integrate keyboard shortcuts for poll control
- Update version to 1.1.1 in package.json
- Implement keyboard shortcuts for poll control and enhance PollResults component
- Update title and meta tags for application branding
- Update countdown overlay styling for improved visibility
- Enhance polling mechanism with intermediate updates and improved sync interval
- Update application name from TikTok LIVE Chat Reader to Omni LIVE Tools
- Update package.json version and description; add @twurple/auth and @twurple/chat dependencies
- Add @twurple/auth and @twurple/chat dependencies to package.json

### Changed

- Update version to 1.4.0 in package.json
- Enhance timer bar styling and improve background layout in PollQuestion component
- Update size configuration in PollOptionCard for improved styling consistency
- Update version to 1.3.0 in package.json
- Improve connection handling in useMultiPlatformConnection for better cleanup and error management
- Remove variant tests from PollControlButtons test suite for simplification
- Update version to 1.2.7 and simplify description in package.json
- Update onStop shortcut from Escape to CTRL+, in usePollKeyboardShortcuts tests
- Update keyboard shortcuts for stopping poll and add example for Escape key
- Add unit tests for poll components, hooks, and utility functions
- Add SpotlightTrophyCelebration component and integrate into PollResultsPage

### Fixed

- Correct key label formatting for keyboard shortcuts in shortcutToLabel function

### Documentation

- Update README to reflect project name change and enhance testing section

## [1.0.0] - 2026-02-10

### Added

- Reposition countdown overlay within results section and adjust styling
- Replace confetti celebration with spotlight trophy animation on poll completion
- Implement countdown feature for polls with visual feedback
- Add SplashScreen component for improved loading experience
- Update application icons with new designs for better branding
- Add logo images and update Header component to use the new logo
- Rename project to Omni LIVE Tools and update related configurations
- Enhance README with language support details and update features section
- Add internationalization support for English and Portuguese translations
- Rename project to Omni LIVE Chat Reader and update related configurations
- Add fallback avatar support to ProfilePicture and update ChatMessage and VoteLog components
- Implement multi-platform connection support for TikTok and Twitch

### Changed

- Add footer with author credit to README
- Initial commit

### Fixed

- Correct product name formatting in electron-builder configuration
- Update source link in HomePage to reflect new project name

### Documentation

- Update README to include Electron badge and reorganize table of contents
- Update README to enhance features section and add real-time chat reading details
- Enhance README with detailed language support and updated poll feature instructions
- Add link to tikTok-chat-reader-jb in Credits section

[1.16.2]: https://github.com/filipe1309/omni-live-tools/compare/v1.16.1...v1.16.2
[1.16.1]: https://github.com/filipe1309/omni-live-tools/compare/v1.16.0...v1.16.1
[1.16.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.15.0...v1.16.0
[1.15.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.14.0...v1.15.0
[1.14.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.13.0...v1.14.0
[1.13.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.12.0...v1.13.0
[1.12.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.11.0...v1.12.0
[1.11.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.10.0...v1.11.0
[1.10.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.9.0...v1.10.0
[1.9.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.8.0...v1.9.0
[1.8.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.7.0...v1.8.0
[1.7.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.6.0...v1.7.0
[1.6.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.5.0...v1.6.0
[1.5.0]: https://github.com/filipe1309/omni-live-tools/compare/v1.0.0...v1.5.0
[1.0.0]: https://github.com/filipe1309/omni-live-tools/releases/tag/v1.0.0
