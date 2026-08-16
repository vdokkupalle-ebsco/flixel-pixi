# Teardown Soak & GC Verification

Automated rapid boot/destroy test suite that cycles through 30+ engine initializations and teardowns to verify zero resource leaks, zero retained listeners, and complete memory reclamation.

<DemoEmbed
  src="/games/bench-soak/index.html"
  title="Teardown Soak Benchmark"
  controlsHint="Watch automated repeated boot/render/destroy cycles verify zero memory leaks."
  height="480px"
/>

[View Source on GitHub](https://github.com/vdokkupalle-ebsco/flixel-pixi/tree/main/examples/games/bench-soak)
