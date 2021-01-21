import { useState, useEffect, useCallback } from 'react'
import './App.css'
import download from 'downloadjs'
import FrameChooser from './FrameChooser.js'
import HeaderImage from './HeaderImage.svg'

import mergeImages from 'merge-images'

const frameSize = 1080

function App() {
    const [frameURL, setFrameURL] = useState(null)
    const [photo, setPhoto] = useState(null)
    const [combinedImage, setCombinedImage] = useState(null)

    const handleFrameURL = useCallback(newFrameURL => {
        setFrameURL(newFrameURL)
    }, [setFrameURL])

    const handleImage = useCallback(files_event => {
        const reader = new FileReader()
        reader.onload = reader_event => {
            const img = new Image()
            img.onload = function () {
                const offscreenCanvas = document.createElement('canvas')
                offscreenCanvas.width = frameSize
                offscreenCanvas.height = frameSize

                const offscreenCanvas_ctx = offscreenCanvas.getContext('2d', { alpha: false })

                const width = frameSize
                const height = (img.height / img.width) * frameSize
                offscreenCanvas_ctx.drawImage(
                    img,
                    (frameSize - width) / 2,
                    (frameSize - height) / 2,
                    width,
                    height,
                );

                const pngUrl = offscreenCanvas.toDataURL()
                setPhoto(pngUrl)
            }
            img.src = reader_event.target.result
        }
        reader.readAsDataURL(files_event.target.files[0])
    }, [setPhoto])

    useEffect(() => {
        mergeImages([
            ...(photo ? [photo] : []),
            ...(frameURL ? [frameURL] : []),
        ])
        .then(b64 => setCombinedImage(b64))
    }, [photo, frameURL])



return (
    <div className="App">
            <input type="file" onChange={handleImage} />
        <img src={HeaderImage} className="HeaderImage" />

            <img src={combinedImage} className="App-logo" alt="Finished Frame" />

        <FrameChooser onFrameChange={handleFrameURL} />
        <button onClick={() => download(combinedImage, "volt-profile-picture.png", "image/png")}>Download Profile Picture</button>
    </div>
)
}

export default App;
