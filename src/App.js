import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { useDropzone } from 'react-dropzone'
import FrameChooser from './FrameChooser.js'
import HeaderImage from './HeaderImage.svg'

import mergeImages from 'merge-images'

const frameSize = 1080

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
                
                ctx.drawImage(
                    img,
                    (frameSize - width) / 2,
                    (frameSize - height) / 2,
                    width,
                    height,
                )

                const pngUrl = canvas.toDataURL()
                setPhoto(pngUrl)
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
