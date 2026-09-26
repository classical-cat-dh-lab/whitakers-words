# 0.3.2-beta.1 candidate

This frontend candidate adds passage reading while retaining the frozen 0.3.0
engine and original dictionary. It has not replaced the published 0.3.1 release.

- Select a word in the original passage to switch its dictionary details without
  reloading or querying again. Display options choose Text + list, Text only or
  List only; both views are enabled by default.
- Collapsed list rows contain the input word and principal parts. Identical
  headings are shown once in a summary; all candidates remain in the details.
  Expanded entries show principal parts, fixed grammar, English meanings and
  possible forms in that order.
- Clear input sits beside Look up. Completion time and browser connection status
  share the Display options row when space permits. The version badge includes
  0.3.2 beta, and the keyboard instructions name both Enter and Return.
- The footer links to offline help, a separate terminology page, and a source and
  documentation hub containing tested scope, compatibility and license notices.
- Check for updates checks the manifest and saved files. A current intact bundle
  downloads no runtime files. Download update appears when a new bundle is known;
  verified unchanged resources are reused. Activation still requires Reload.

Application: 0.3.2-beta.1. Engine: 0.3.0-beta.1. The browser input adapter, library,
CLI, legacy output, original dictionary and frozen backend hashes are unchanged.
See [browser use](browser-input.md) and [backend acceptance](acceptance.md).
