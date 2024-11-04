<script setup lang="ts">
import { ref, watch, onUnmounted, type Ref, toRef } from 'vue'
import type { ImageDefinition } from 'jazz-tools'

interface ImageState {
    src?: string
    res?: `${number}x${number}` | 'placeholder'
    originalSize?: readonly [number, number]
}

function useProgressiveImg(
    image: Ref<ImageDefinition | null | undefined>,
    maxWidth?: number
) {
    const current = ref<ImageState>({})

    let cleanup: (() => void) | undefined
    const unsubscribe = watch(
        () => [image.value?.id, maxWidth],
        () => {
            let lastHighestRes: string | undefined

            if (!image.value) return

            const unsub = image.value.subscribe({}, (update) => {
                const highestRes = update?.highestResAvailable({ maxWidth })

                if (highestRes) {
                    if (highestRes.res !== lastHighestRes) {
                        lastHighestRes = highestRes.res
                        const blob = highestRes.stream.toBlob()

                        if (blob) {
                            const blobURI = URL.createObjectURL(blob)
                            current.value = {
                                src: blobURI,
                                res: highestRes.res,
                                originalSize: image.value?.originalSize
                            }

                            if (cleanup) cleanup()
                            cleanup = () => {
                                setTimeout(() => URL.revokeObjectURL(blobURI), 200)
                            }
                        }
                    }
                } else {
                    current.value = {
                        src: update?.placeholderDataURL,
                        res: 'placeholder',
                        originalSize: image.value?.originalSize
                    }
                }
            })

            return unsub
        }
    )

    onUnmounted(() => {
        unsubscribe()
        if (cleanup) cleanup()
    })

    return current
}

const props = defineProps<{
    image: ImageDefinition | null | undefined
    maxWidth?: number
}>()

const current = useProgressiveImg(toRef(props, 'image'), props.maxWidth)
</script>

<template>
  <slot
    :src="current.src"
    :res="current.res"
    :original-size="current.originalSize"
  />
</template>