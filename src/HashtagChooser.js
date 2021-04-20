import { useState, useEffect, useCallback } from 'react'
import { withLocalization } from './Localized.js'

function HashtagChooser({ onChange, getString }) {
    const [frames, setFrames] = useState([])
    const [choosenFrame, setChoosenFrame] = useState(null)

    const choosenFrameSRC = !!choosenFrame ? choosenFrame.src : null

    useEffect(() => {
        async function loadFrames() {
            Promise.all(
                [
                    '',
                    '#VoteVolt',
                    '#JoinTheChange',
                    '#RejoinEU',
                    '#DeineWahl',
                    '#JetztBistDuDran',
                    '#VoltEuropa',
                    '#VoltRLP',
                    '#Volt21',
                    '#Volt',
                    '#paneuropäisch',
                    '#pragmatisch',
                    '#progressiv',
                    '#Europa',

                    '#democracy',
                    '#EUReform',
                    '#European',
                    '#EuropeCares',
                    '#FutureMadeInEurope',
                    '#ValuesOverPower',
                    '#ZukunftMadeInEurope',

                    '#IkStemVolt',
                    'stemvolt.nl',

                    '#VoltForLGBTIAQ',
                ]
                    .map(async frame_filename => {
                        return {
                            name: frame_filename,
                            src: frame_filename === '' ? '' : (await import(`./hashtags/${frame_filename}.png`)).default,
                        }
                    })
            )
                .then(new_frames => {
                    setFrames(new_frames)
                    setChoosenFrame(new_frames[0])
                })
        }
        loadFrames()
    }, [])

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
                    return <button key={frame.name} data-src={frame_src_path} className={isChoosen ? 'isInRow choosen' : 'isInRow'} onClick={() => handleImageChoosing(frame)}>
                        {frame.name === '' ? getString('button_no_hashtag') : frame.name}
                    </button>
                })
            }
        </div>
    )
}

export default withLocalization(HashtagChooser)
