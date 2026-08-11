# Ambient audio demo assets

The project owner supplied these Mixkit WAV files for the ambient spatial-audio
demo. Filenames are normalized for the build; the original downloads were:

- `mixkit-water-flowing-ambience-loop-3126.wav`
- `mixkit-tick-tock-clock-timer-1045.wav`
- `mixkit-retro-game-emergency-alarm-1000.wav`

The demo preloads all three WAVs during its startup loading session and plays
them from local blob URLs. This avoids a second request or a delayed first play
when a source enters the viewport.

Confirm the applicable Mixkit license before redistributing these files outside
this project.
