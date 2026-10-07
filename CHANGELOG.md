# Change Log

## 5.0.0 (2026-10-07)

### Added

- Sync across windows. Edits made in one VS Code window are picked up by other windows through a file watcher and on window focus. Every write re-reads the file first, so one window no longer overwrites another's changes.
- Confirmation dialog before Delete.
- Marketplace icon and metadata, rewritten README.

### Fixed

- "Reveal in File Explorer" did nothing on Linux and macOS. It used the Windows-only `start` command and now uses VS Code's built-in `revealFileInOS`.
- Delete sometimes removed the wrong item or nothing at all, because a group item's key was overwritten by a child's key.

### Changed

- Rename, Delete, Create Dict and Create List now resolve the target by its path in the tree instead of by object identity.
- Updated to TypeScript 5, ESLint 9 and the VS Code 1.90 API. Removed the leftover `catCoding` sample.

## 2023-01-16

- Added "Reveal in File Explorer" as an inline icon.

## 2022-10-10

- Fixed items disappearing when dropped into the folder they were already in.
- "Get path from item" copies all paths of a multi-path item.

## 2022-10-08

- Added the right-click menu on tree items.
- Added "Add To PMDJ" to the Explorer context menu.

## 2022-10-02

- Drag and drop between groups.

## 2022-09-12

- Fixed paths containing spaces not opening.

## 2022-08-30

- Backslashes are converted to forward slashes when a path is added.
- The current `.code-workspace` file can be registered, not only folders.

## 2022-08-25

- Switched to `jsonc-parser`. Comments and trailing commas are allowed in the configuration file.

## 2022-08-24

- Fixed folders failing to open.

## 2022-08-19

- Multi-path items open every path at once.
- The configuration file is reformatted on load.
- "Open Project In This Window".

## 2022-08-17

- Inline button to open in the current window.

## 2022-08-15

- Remember which groups are expanded. Entries for paths that no longer exist are dropped.
- Clicking a row opens it instead of an inline button.
- Removed unused SVG files to speed up activation.

## 2022-08-13

- First version: separate configuration file, button to open it, add the current folder, open in a new window, refresh.
