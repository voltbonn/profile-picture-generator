import { useState, useEffect, useCallback } from 'react'
import { withLocalization } from './Localized.js'

function HashtagChooser({ onChange, getString }) {
    const [frames, setFrames] = useState([])
    const [choosenFrame, setChoosenFrame] = useState(null)

    const choosenFrameSRC = !!choosenFrame ? choosenFrame.src : null

    let hashtags = getString('hashtags')

    useEffect(() => {
        async function loadFrames() {

            let counter = 0
            hashtags = hashtags.split('\n')
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0)

            Promise.all(
                [
                    '',
                    ...hashtags
                ]
                    .map(async frame_filename => {
                        let src = frame_filename
                        if (frame_filename !== '') {
                            src = (await import(`./hashtags/${frame_filename}.png`)).default
                        }
                        return {
                            name: frame_filename,
                            src
                        }
                    })
            )
                .then(new_frames => {
                    setFrames(new_frames)
                    setChoosenFrame(new_frames[0])
                })
        }
        loadFrames()
    }, [hashtags])

    const handleImageChoosing = useCallback(frame => {
        setChoosenFrame(frame)
    }, [setChoosenFrame])

    useEffect(() => {
        onChange(choosenFrame)
    }, [onChange, choosenFrame])

    return (
        <div className="HashtagChooser">
            {
                frames.map(frame => {
                    const frame_src_path = frame.src
                    const isChoosen = choosenFrameSRC === frame_src_path
                    return <button
                        key={frame.name}
                        data-src={frame_src_path}
                        className={isChoosen ? 'isInRow choosen' : 'isInRow'}
                        onClick={() => handleImageChoosing(frame)}
                    >
                        {frame.name === '' ? getString('button_no_hashtag') : frame.name}
                    </button>
                })
            }
        </div>
    )
}

export default withLocalization(HashtagChooser)
