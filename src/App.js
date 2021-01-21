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
        <img src={HeaderImage} className="HeaderImage" alt="Volt Logo" />

        <h2>Choose your Photo:</h2>

        <label className="labelButton" tabIndex="0" style={{outline:'none'}}>
            {!!photo ? <img src={photo} alt="Preview" /> : null}
            <span>Load Photo</span>
            <input onChange={handleImage} type="file" accept="image/*" style={{display: 'none'}} />
        </label>

        <FrameChooser onFrameChange={handleFrameURL} />
           
        <h2>Download your Photo:</h2>
        <img src={combinedImage} className="FinishedFrame" alt="Finished Frame" />
        <button onClick={() => download(combinedImage, "volt-profile-picture.png", "image/png")}>Download Profile Picture</button>
    </div>
)
}

export default App;
