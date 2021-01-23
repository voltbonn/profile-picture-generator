import { useState, useCallback } from 'react'
import './App.css'
import { useDropzone } from 'react-dropzone'
import FrameChooser from './FrameChooser.js'
import HashtagChooser from './HashtagChooser.js'
import Editor from './Editor.js'
import HeaderImage from './HeaderImage.svg'
import purpleBG from './purpleBG.png'

import mergeImages from 'merge-images'

const frameSize = 1080

function getOrientation(file, callback) {
    // Source: http://stackoverflow.com/a/32490603
    // (With some modifications: I just made the code fit the style-guide.)
    const reader = new FileReader()

    reader.onload = function (event) {
        const view = new DataView(event.target.result)

        if (view.getUint16(0, false) !== 0xFFD8) {
            return callback(-2)
        }

        const length = view.byteLength
        let offset = 2

        while (offset < length) {
            const marker = view.getUint16(offset, false)
            offset += 2

            if (marker === 0xFFE1) {
                if (view.getUint32(offset += 2, false) !== 0x45786966) {
                    return callback(-1)
                }
                const little = view.getUint16(offset += 6, false) === 0x4949
                offset += view.getUint32(offset + 4, little)
                const tags = view.getUint16(offset, little)
                offset += 2

                for (var i = 0; i < tags; i++) {
                    if (view.getUint16(offset + (i * 12), little) === 0x0112) {
                        return callback(view.getUint16(offset + (i * 12) + 8, little))
                    }
                }
            } else if ((marker & 0xFF00) !== 0xFF00) {
                break
            } else {
                offset += view.getUint16(offset, false)
            }
        }
        return callback(-1)
    }

    reader.readAsArrayBuffer(file.slice(0, 64 * 1024))
}

function trigger_download(name, data){
    const a = document.createElement('a')
    document.body.appendChild(a)
    // a.target = '_blank'
    a.download = name
    a.href = data
    a.click()
    a.remove()
}

function App() {
    const [frameURL, setFrameURL] = useState(null)
    const [hashtagURL, setHashtagURL] = useState(null)
    const [originalPhoto, setOriginalPhoto] = useState(null)
    const [originalPhotoRation, setOriginalPhotoRation] = useState(1)
    const [orientation, set_orientation] = useState(null)


    // const [combinedImage, set_combinedImage] = useState(null)

    const [width, set_width] = useState(0)
    const [height, set_height] = useState(0)

    const [cords, setCords] = useState({x:0, y:0, scale:1})

    const handleFrameURL = useCallback(newFrameURL => {
        setFrameURL(newFrameURL)
    }, [setFrameURL])

    const handleHashtagURL = useCallback(newHashtagURL => {
        setHashtagURL(newHashtagURL)
    }, [setHashtagURL])

    const handleCordsChange = useCallback(({x, y, scale}) => {
        setCords({ x, y, scale })
    }, [])

    const handleReadFile = useCallback(file => {
        if (!(!!file)) {
            return;
        }

        const reader = new FileReader()
        reader.onload = reader_event => {
            const img = new Image()
            img.onload = function () {
                let width, height;
                if (img.width < img.height) {
                    height = (img.height / img.width) * frameSize
                    width = frameSize
                } else {
                    height = frameSize
                    width = (img.width / img.height) * frameSize
                }

                getOrientation(file, new_orientation => {
                    let original_ration = 1
                    // use the correct image orientation
                    switch (new_orientation) {
                        // Source: https://stackoverflow.com/a/30242954/2387277
                        // Source: https://stackoverflow.com/questions/19463126/how-to-draw-photo-with-correct-orientation-in-canvas-after-capture-photo-by-usin
                        case 2:
                            // horizontal flip
                            original_ration = height / width
                            break
                        case 3:
                            // 180° rotate left
                            original_ration = height / width
                            break
                        case 4:
                            // vertical flip
                            original_ration = height / width
                            break
                        case 5:
                            // vertical flip + 90 rotate right
                            original_ration = width / height
                            break
                        case 6:
                            // 90° rotate right
                            original_ration = width / height
                            break
                        case 7:
                            // horizontal flip + 90 rotate right
                            original_ration = width / height
                            break
                        case 8:
                            // 90° rotate left
                            original_ration = width / height
                            break
                        default:
                            original_ration = height / width
                            break
                    }

                    set_width(width)
                    set_height(height)
                    setOriginalPhoto(reader_event.target.result)
                    set_orientation(new_orientation)
                    setOriginalPhotoRation(original_ration)
                })
            }
            img.src = reader_event.target.result
        }
        reader.readAsDataURL(file)
    }, [])

    const handleImage = useCallback(files_event => {
        handleReadFile(files_event.target.files[0])
    }, [handleReadFile])

    const onDrop = useCallback(acceptedFiles => {
        handleReadFile(acceptedFiles[0])
    }, [handleReadFile])

    const handleDownload = useCallback(() => {
        const img = new Image()
        img.onload = function () {
            const canvas = document.createElement('canvas')
            canvas.width = frameSize
            canvas.height = frameSize

            const ctx = canvas.getContext('2d', { alpha: true })

            // use the correct image orientation
            switch (orientation) {
                // Source: https://stackoverflow.com/a/30242954/2387277
                // Source: https://stackoverflow.com/questions/19463126/how-to-draw-photo-with-correct-orientation-in-canvas-after-capture-photo-by-usin
                case 2:
                    // horizontal flip
                    ctx.translate(canvas.width, 0)
                    ctx.scale(-1, 1)
                    break
                case 3:
                    // 180° rotate left
                    ctx.translate(canvas.width, canvas.height)
                    ctx.rotate(Math.PI)
                    break
                case 4:
                    // vertical flip
                    ctx.translate(0, canvas.height)
                    ctx.scale(1, -1)
                    break
                case 5:
                    // vertical flip + 90 rotate right
                    ctx.rotate(0.5 * Math.PI)
                    ctx.scale(1, -1)
                    break
                case 6:
                    // 90° rotate right
                    ctx.rotate(0.5 * Math.PI)
                    ctx.translate(0, -canvas.height)
                    break
                case 7:
                    // horizontal flip + 90 rotate right
                    ctx.rotate(0.5 * Math.PI)
                    ctx.translate(canvas.width, -canvas.height)
                    ctx.scale(-1, 1)
                    break
                case 8:
                    // 90° rotate left
                    ctx.rotate(-0.5 * Math.PI)
                    ctx.translate(-canvas.width, 0)
                    break
                default:
                    break
            }


            const width_scaled = width * cords.scale
            const height_scaled = height * cords.scale

            ctx.drawImage(
                img,
                cords.x * 3.5 + (frameSize - width_scaled) * 0.5,
                cords.y * 3.5 + (frameSize - height_scaled) * 0.5,
                width_scaled,
                height_scaled,
            )
            // ctx.drawImage(
            //     img,
            //     ((frameSize - width_scaled) * 0.5),
            //     ((frameSize - height_scaled) * 0.5),
            //     width_scaled,
            //     height_scaled,
            // )

            const pngUrl = canvas.toDataURL()

            mergeImages([
                purpleBG,
                ...(pngUrl ? [pngUrl] : []),
                ...(frameURL ? [frameURL] : []),
                ...(hashtagURL ? [hashtagURL] : []),
            ])
            .then(b64 => {
                // set_combinedImage(b64)
                trigger_download('volt-profile-picture.png', b64)
            })

        }
        img.src = originalPhoto
    }, [
        originalPhoto,
        cords.x,
        cords.y,
        cords.scale,
        orientation,
        frameURL,
        hashtagURL,
        height,
        width,
    ])

    const { isDragActive, getRootProps } = useDropzone({
        onDrop,
        accept: 'image/*',
        maxFiles: 1,
        noKeyboard: true,
    })


    return (
        <div className="App" {...getRootProps()}>
            <img src={HeaderImage} className="HeaderImage" alt="Volt Logo" />

            <div className={isDragActive ? 'droparea active' : 'droparea'}>
                Drop your photo here ...
            </div>

            <h2>Choose your Photo:</h2>
            <p>It should best be a square image or your face in the middle. The photo is not saved and never leaves your computer.</p>

            <label className="labelButton" tabIndex="0" style={{outline:'none'}}>
                {!!originalPhoto ? <img src={originalPhoto} alt="Preview" /> : null}
                <span>{!!originalPhoto ? 'Change Photo' : 'Load Photo'}</span>
                <input onChange={handleImage} type="file" accept="image/*" style={{display: 'none'}} />
            </label>

            {!!originalPhoto ? (<>
                <FrameChooser onChange={handleFrameURL} />
                <HashtagChooser onChange={handleHashtagURL} />
            </>) : null}

            {!!originalPhoto && !!frameURL ? (<>
                <h2>Reposition your Photo:</h2>
                {/*
                <h2>Edit your Photo:</h2>
                <p>Your can reposition the image and scale it. Use pinch-to-zoom or scroll to scale.</p>
                */}

                <Editor
                    backgroundURL={originalPhoto || empty_1x1}
                    backgroundRatio={originalPhotoRation}
                    frameURL={frameURL}
                    hashtagURL={hashtagURL || empty_1x1}
                    onChange={handleCordsChange}
                />

                <button onClick={handleDownload}>Download Profile Picture</button>
            </>) : null}
        </div>
    )
}

export default App
