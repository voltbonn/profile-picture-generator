import { useState, useEffect, useCallback } from 'react'
import './App.css'
import { useDropzone } from 'react-dropzone'
import mergeImages from 'merge-images'
import FrameChooser from './FrameChooser.js'
import HashtagChooser from './HashtagChooser.js'
import Editor from './Editor.js'
import VoltLogoPurple from './VoltLogoPurple.svg'
import purpleBG from './purpleBG.png'
import empty_1x1 from './empty_1x1.png'

import 'intl-pluralrules'
import { AppLocalizationProvider, locales } from './l10n.js'
import { withLocalization, Localized } from './Localized.js'


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

function UmamiLink({ href, name, target, children, ...props }) {
    const handleClick = useCallback(event => {

        if (name) {
            window.umami.trackEvent('A: ' + name) // Log Anker / Link
        }

        // follow link
        if (!(!!target)) {
            setTimeout(() => {
                window.location = href
            }, 200)
        }else{
            window.open(href, target)
        }

        // Prevent normal href-follow
        event.preventDefault()
        return false
    }, [href, name])

    return <a
        {...props}
        href={href}
        onClick={handleClick}
    >
        {children}
    </a>
}

function App({ getString }) {
    const [frame, setFrame] = useState(null)
    const [hashtag, setHashtag] = useState(null)
    const [originalPhoto, setOriginalPhoto] = useState(null)
    const [originalPhotoRation, setOriginalPhotoRation] = useState(1)
    const [orientation, set_orientation] = useState(null)

    const frameURL = !!frame ? frame.src : null
    const hashtagURL = !!hashtag ? hashtag.src : null

    // const [combinedImage, set_combinedImage] = useState(null)

    const [width, set_width] = useState(0)
    const [height, set_height] = useState(0)

    const [cords, setCords] = useState({x:0, y:0, scale:1})

    const handleFrame = useCallback(newFrame => {
        setFrame(newFrame)
    }, [setFrame])

    const handleHashtag = useCallback(newHashtag => {
        setHashtag(newHashtag)
    }, [setHashtag])

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

                const frameName = frame.name || 'No-Frame'
                const hashtagName = hashtag.name || 'No-Hashtag'

                window.umami.trackEvent('F: ' + frameName) // Log Frame
                window.umami.trackEvent('H: ' + hashtagName) // Log Hashtag
                window.umami.trackEvent('C: ' + [frameName, hashtagName].join(' | '))  // Log Combined
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
        frame,
        hashtag
    ])

    const { isDragActive, getRootProps } = useDropzone({
        onDrop,
        accept: 'image/*',
        maxFiles: 1,
        noKeyboard: true,
    })

    return (
        <div className="App" {...getRootProps()}>
            <img src={VoltLogoPurple} className="HeaderImage" alt={getString('alt_volt_logo')} />
            <h1><Localized id="title_profile_generator" /></h1>

            <div className={isDragActive ? 'droparea active' : 'droparea'}>
                <Localized id="title_drop_photo_here" />
            </div>

            <h2><Localized id="title_choose_photo" /></h2>
            <p><Localized id="text_choose_photo_info" /></p>

            <label className="labelButton" tabIndex="0" style={{outline:'none'}}>
                {!!originalPhoto ? <img src={originalPhoto} alt="Preview" /> : null}
                <span>{!!originalPhoto ? getString('button_change_photo') : getString('button_load_photo') }</span>
                <input onChange={handleImage} type="file" accept="image/*" style={{display: 'none'}} />
            </label>

            {true || !!originalPhoto ? (<>
                <h2><Localized id="title_choose_frame" /></h2>
                <FrameChooser onChange={handleFrame} />
                <h2><Localized id="title_choose_hashtag" /></h2>
                <HashtagChooser onChange={handleHashtag} />
            </>) : null}

            {!!originalPhoto && !!frameURL ? (<>
                <h2><Localized id="title_reposition_photo" /></h2>
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

                <button onClick={handleDownload}><Localized id="button_download" /></button>
            </>) : null}

            <footer>
                <UmamiLink name="imprint" href="https://www.voltdeutschland.org/impressum">
                    <Localized id="link_imprint" />
                </UmamiLink>
                &nbsp; • &nbsp;
                <UmamiLink name="privacy_policy" href="https://www.voltdeutschland.org/datenschutz">
                    <Localized id="link_privacy_policy" />
                </UmamiLink>
                &nbsp; • &nbsp;
                <UmamiLink name="source_code" href="https://github.com/voltbonn/profile-picture-generator">
                    <Localized id="link_source_code" />
                </UmamiLink>
                &nbsp; • &nbsp;
                <UmamiLink name="contact" href="mailto:thomas.rosen@volteuropa.org">
                    <Localized id="link_app_contact" />
                </UmamiLink>
            </footer>
        </div>
    )
}
const AppLocalized = withLocalization(App)


function AppWrapper() {
    const [userLocales, setUserLocales] = useState(navigator.languages)
    const [currentLocale, setCurrentLocale] = useState(null)

    useEffect(() => {
        let systemLocales = navigator.languages
        if (!!systemLocales || Array.isArray(systemLocales)) {
            for (const locale of systemLocales) {
                window.umami.trackEvent('L: ' + locale) // Log Locale / Languages
            }
        }
    }, [])

    const handleLanguageChange = useCallback(event => {
        setUserLocales([event.target.dataset.locale])
    }, [setUserLocales])

    const handleCurrentLocalesChange = useCallback(currentLocales => {
        setCurrentLocale(currentLocales.length > 0 ? currentLocales[0] : '')
    }, [setCurrentLocale])

    return <AppLocalizationProvider
        key="AppLocalizationProvider"
        userLocales={userLocales}
        onLocaleChange={handleCurrentLocalesChange}
    >
        <>
            <AppLocalized />

            <div className="locale_chooser">
                {
                    Object.entries(locales)
                    .map(([locale, name]) => {
                        return <button
                            className={locale === currentLocale ? 'isInRow choosen' : 'isInRow'}
                            key={locale}
                            data-locale={locale}
                            onClick={handleLanguageChange}
                        >
                            {name}
                        </button>
                    })
                }
            </div>
        </>
    </AppLocalizationProvider>
}
export default withLocalization(AppWrapper)

