import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { useDropzone } from 'react-dropzone'
import FrameChooser from './FrameChooser.js'
import HeaderImage from './HeaderImage.svg'

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

function App() {
    const [frameURL, setFrameURL] = useState(null)
    const [originalPhoto, setOriginalPhoto] = useState(null)
    const [photo, setPhoto] = useState(null)
    const [combinedImage, setCombinedImage] = useState(null)

    const handleFrameURL = useCallback(newFrameURL => {
        setFrameURL(newFrameURL)
    }, [setFrameURL])


    const handleReadFile = useCallback(file => {
        if (!(!!file)) {
            return;
        }

        const reader = new FileReader()
        reader.onload = reader_event => {
            const img = new Image()
            img.onload = function () {
                const canvas = document.createElement('canvas')
                canvas.width = frameSize
                canvas.height = frameSize

                const ctx = canvas.getContext('2d', { alpha: true })

                let width, height;
                if (img.width < img.height) {
                    height = (img.height / img.width) * frameSize
                    width = frameSize
                } else {
                    height = frameSize
                    width = (img.width / img.height) * frameSize
                }

                getOrientation(file, orientation => {
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

                    ctx.drawImage(
                        img,
                        (frameSize - width) / 2,
                        (frameSize - height) / 2,
                        width,
                        height,
                    )

                    const pngUrl = canvas.toDataURL()
                    setPhoto(pngUrl)
                })
            }
            img.src = reader_event.target.result
            setOriginalPhoto(reader_event.target.result)
        }
        reader.readAsDataURL(file)
    }, [])

    const handleImage = useCallback(files_event => {
        handleReadFile(files_event.target.files[0])
    }, [handleReadFile])

    const onDrop = useCallback(acceptedFiles => {
        handleReadFile(acceptedFiles[0])
    }, [handleReadFile])

    const { isDragActive, getRootProps } = useDropzone({
        onDrop,
        accept: 'image/*',
        maxFiles: 1,
        noKeyboard: true,
    })


    useEffect(() => {
        mergeImages([
            ...(photo ? [photo] : []),
            ...(frameURL ? [frameURL] : []),
        ])
        .then(b64 => setCombinedImage(b64))
    }, [photo, frameURL])


    return (
        <div className="App" {...getRootProps()}>
            <img src={HeaderImage} className="HeaderImage" alt="Volt Logo" />

            <div className={isDragActive ? 'droparea active' : 'droparea'}>
                Drop your photo here ...
            </div>

            <h2>Choose your Photo:</h2>
            <p>It should best be a square image or your face in the middle. The photo is not saved and never leaves your computer.</p>

            <label className="labelButton" tabIndex="0" style={{outline:'none'}}>
                {!!photo ? <img src={originalPhoto} alt="Preview" /> : null}
                <span>{!!photo ? 'Change Photo' : 'Load Photo'}</span>
                <input onChange={handleImage} type="file" accept="image/*" style={{display: 'none'}} />
            </label>

            <FrameChooser onFrameChange={handleFrameURL} />

            <h2>Download your Photo:</h2>
            <img src={combinedImage} className="FinishedFrame" alt="Finished Frame" />
            <a download="volt-profile-picture.png" href={combinedImage} target="_blank" rel="noreferrer">
                <button>Download Profile Picture</button>
            </a>
        </div>
    )
}

export default App
