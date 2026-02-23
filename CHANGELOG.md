# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


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
