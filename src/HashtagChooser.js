import { useState, useEffect, useCallback } from 'react'

function HashtagChooser({ onChange }) {
    const [frames, setFrames] = useState([])
    const [choosenFrame, setChoosenFrame] = useState(null)

    useEffect(() => {
        async function loadFrames() {
            Promise.all(
                [
                    '',
                    'DeineWahl',
                    'Europa',
                    'JetztBistDuDran',
                    'paneuropäisch',
                    'pragmatisch',
                    'progressiv',
                    'Volt',
                    'Volt21',
                    'VoltEuropa',
                    'VoltRLP',
                    'VoteVolt',
                ]
                    .map(async frame_filename => {
                        return {
                            name: frame_filename,
                            src: frame_filename === '' ? '' : await import(`./hashtags/${frame_filename}.png`),
                        }
                    })
            )
                .then(new_frames => {
                    setFrames(new_frames)
                    setChoosenFrame(new_frames[0].src.default)
                })
        }
        loadFrames()
    }, [])

    const handleImageChoosing = useCallback(event => {
        setChoosenFrame(event.target.dataset.src)
    }, [setChoosenFrame])

    useEffect(() => {
        onChange(choosenFrame)
    }, [onChange, choosenFrame])

    return (
        <div className="HashtagChooser">
            <h2>Choose a Hashtag:</h2>
            {
                frames.map(frame => {
                    const frame_src_path = frame.src.default
                    const isChoosen = choosenFrame === frame_src_path
                    return <button key={frame_src_path} data-src={frame_src_path} className={isChoosen ? 'hashtag_button choosen' : 'hashtag_button'} onClick={handleImageChoosing}>
                        {frame.name === '' ? 'No Hashtag' : '#'+frame.name}
                    </button>
                })
            }
        </div>
    )
}

export default HashtagChooser
