# Version 1.0.3 — clear update version notices

Update notices now lead with the target application version and label the current
saved version separately. Once the downloaded update is verified, the reload
button names that exact version. A newer update check cannot relabel an already
verified pending update. Ordinary ready-offline and up-to-date messages still
identify the saved application version.

Previously, the notice displayed only the saved version followed by a generic
update message. A saved 1.0.0 installation therefore displayed 1.0.0 while updating
successfully to 1.0.2. The download and activation selected the correct release;
the misleading text came from the old page's update interface.

An already saved older page retains its old wording during the update to 1.0.3.
After reloading into 1.0.3, the corrected notices apply to subsequent updates.
There is no need to clear offline storage or download the dictionary twice.

Application **1.0.3** retains frozen **engine 1.0.0** and the 1.0.2 English passage
interface. Engine/data/API/CLI behavior and update selection, verification,
activation and cache retention are unchanged. No English noun-number normalization
is included. [Offline help](offline-help.md) describes the update flow.

This patch is distributed through
[GitHub](https://github.com/classical-cat-dh-lab/whitakers-words/releases/tag/v1.0.3)
and the website. No new Zenodo archive is requested; existing milestone archives
and previous releases remain unchanged.
