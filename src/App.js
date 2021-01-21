import { useState, useEffect, useCallback } from 'react'
import './App.css'

import frame_mixed from './frames/ProfileFrame Mixed Bars.png'

import mergeImages from 'merge-images'

const frameSize = 1080

function App() {
    const [photo, setPhoto] = useState(null)
    const [combinedImage, setCombinedImage] = useState(null)

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
            ...(frame_mixed ? [frame_mixed] : []),
        ])
        .then(b64 => setCombinedImage(b64))
    }, [photo])



return (
    <div className="App">
        <header className="App-header">
            <label>Load an Image:</label>
            <input type="file" onChange={handleImage} />

            <img src={combinedImage} className="App-logo" alt="Finished Frame" />

        </header>
    </div>
)
}

export default App;
