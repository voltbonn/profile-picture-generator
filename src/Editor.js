import { useEffect, useRef, useState, useCallback } from 'react'

import Hammer from 'hammerjs'
import Hamster from 'hamsterjs'

function updateRange(imageWidth, imageHeight, imageScale, containerWidth, containerHeight) {

    const rangeX = Math.max(0, (imageWidth * imageScale) - containerWidth)
    const rangeY = Math.max(0, (imageHeight * imageScale) - containerHeight)

    const rangeMaxX = (rangeX / 2)
    const rangeMinX = 0 - rangeMaxX

    const rangeMaxY = (rangeY / 2)
    const rangeMinY = 0 - rangeMaxY

    return {
        rangeMaxX,
        rangeMinX,
        rangeMaxY,
        rangeMinY,
    }
}

function clamp(value, min, max) {
    return Math.min(Math.max(min, value), max)
}



let minScale = 1;
let maxScale = 8;



function Editor({ onChange, backgroundURL, backgroundRatio, frameURL, hashtagURL }) {
    const editorRef = useRef(null)
    const backgroundImageRef = useRef(null)

    const [hammer_got_init, set_hammer_got_init] = useState(false)

    const [hammertime, set_hammertime] = useState(null)
    const [hamster, set_hamster] = useState(null)

    const [x, set_x] = useState(0)
    const [y, set_y] = useState(0)
    const [add_x, set_add_x] = useState(0)
    const [add_y, set_add_y] = useState(0)
    const [scale, set_scale] = useState(1)
    // const [add_scale, set_add_scale] = useState(0)

    const [photoWidth, setPhotoWidth] = useState(300)
    const [photoHeight, setPhotoHeight] = useState(300)
    const [editorWidth, setEditorWidth] = useState(300)
    const [editorHeight, setEditorHeight] = useState(300)

    const [rangeMinX, set_rangeMinX] = useState(0)
    const [rangeMinY, set_rangeMinY] = useState(0)
    const [rangeMaxX, set_rangeMaxX] = useState(0)
    const [rangeMaxY, set_rangeMaxY] = useState(0)

    useEffect(() => {
        if (!!onChange) {
            onChange({ x, y, scale})
        }
    }, [onChange, x, y, scale])

    useEffect(() => {
        if (!!editorRef && !!editorRef.current) {
            const new_editorWidth = editorRef.current.offsetWidth
            const new_editorHeight = editorRef.current.offsetHeight
            setEditorHeight(new_editorHeight)
            setEditorWidth(new_editorWidth)

            let new_photoWidth = 1
            let new_photoHeight = 1
            if (backgroundRatio < 1) {
                new_photoWidth = 1 / backgroundRatio
            } else if (backgroundRatio > 1) {
                new_photoHeight = 1 * backgroundRatio
            }

            setPhotoWidth(new_photoWidth)
            setPhotoHeight(new_photoHeight)
        }
    }, [backgroundRatio])

    useEffect(() => {
        const {
            rangeMinX,
            rangeMinY,
            rangeMaxX,
            rangeMaxY,
        } = updateRange(photoWidth * editorWidth, photoHeight * editorHeight, scale, editorWidth, editorHeight)

        set_rangeMinX(rangeMinX)
        set_rangeMinY(rangeMinY)
        set_rangeMaxX(rangeMaxX)
        set_rangeMaxY(rangeMaxY)
    }, [
        photoWidth,
        photoHeight,
        editorWidth,
        editorHeight,
        scale,
    ])

    useEffect(() => {
        set_x(0)
        set_y(0)
        set_add_x(0)
        set_add_y(0)
        set_scale(1)
    }, [backgroundURL])

    const handleMove = useCallback(event => {
        const prev_x = event.target.dataset.x * 1
        const prev_y = event.target.dataset.y * 1

        const new_x = clamp(prev_x + event.deltaX, rangeMinX, rangeMaxX)
        const new_y = clamp(prev_y + event.deltaY, rangeMinY, rangeMaxY)

        if (event.isFinal) {
            set_x(new_x || 0)
            set_y(new_y || 0)
            set_add_x(0)
            set_add_y(0)
        }else{
            set_add_x(new_x - prev_x || 0)
            set_add_y(new_y - prev_y || 0)
        }
    }, [
        rangeMinX,
        rangeMinY,
        rangeMaxX,
        rangeMaxY,
    ])

    const handleScale = useCallback((event, delta, deltaX, deltaY) => {
        event.preventDefault()

        const prev_scale = event.target.dataset.scale * 1
        const new_scale = clamp(prev_scale + delta / 200, minScale, maxScale)
        set_scale(new_scale || 1)

        const prev_x = event.target.dataset.x * 1
        const prev_y = event.target.dataset.y * 1
        set_x(clamp(prev_x, rangeMinX, rangeMaxX) || 0)
        set_y(clamp(prev_y, rangeMinY, rangeMaxY) || 0)
    }, [
        rangeMinX,
        rangeMinY,
        rangeMaxX,
        rangeMaxY,
    ])

    useEffect(() => {
        if (!hammer_got_init && !!editorRef && !!editorRef.current) {
            const element = editorRef.current

            element.addEventListener('mousedown', event => {
                event.preventDefault()
                // event.stopPropagation()
            }, false)
            element.addEventListener("touchstart", event => {
                event.preventDefault()
                // event.stopPropagation()
            }, false)
            element.addEventListener("touchend", event => {
                event.preventDefault()
                // event.stopPropagation()
            }, false)
            element.addEventListener("touchmove", event => {
                event.preventDefault()
                // event.stopPropagation()
            }, false)

            set_hammertime(new Hammer(element, {
                direction: 'DIRECTION_ALL',
            }))

            set_hamster(Hamster(element))

            set_hammer_got_init(true)
        }
    }, [editorRef, hammer_got_init])

    useEffect(() => {
        if (!!hammertime && !!hamster && hammer_got_init && !!editorRef && !!editorRef.current) {
            hammertime.on('pan', handleMove)
            hamster.wheel(handleScale)

            return function () {
                hammertime.off('pan', handleMove)
                hamster.unwheel()
            }
        }
    }, [editorRef, handleMove, handleScale, hammer_got_init, hammertime, hamster])

    return (
        <div
            className="Editor"
            ref={editorRef}
            data-x={x}
            data-y={y}
            data-scale={scale}
        >
            <img
                src={backgroundURL}
                ref={backgroundImageRef}
                alt=""
                className="background"
                style={{
                    width: (photoWidth*100)+'%',
                    height: (photoHeight*100)+'%',
                    transform: `translate3d(calc(-50% + ${x + add_x}px), calc(-50% + ${y + add_y}px), 0)  scale(${scale},${scale})`,
                }}
            />
            <img
                src={frameURL}
                alt=""
                className="foreground"
            />
            <img
                src={hashtagURL}
                alt=""
                className="hashtag"
            />
        </div>
    )
}

export default Editor
