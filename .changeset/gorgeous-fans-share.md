---
"cojson-storage": patch
---

Stop the use of incremental streaming of large CoValue content from local storage peers that triggers sync protocol bug leading to redundant syncing from server peers.
