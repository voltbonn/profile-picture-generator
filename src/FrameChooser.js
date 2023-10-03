import { useState, useEffect, useCallback } from 'react'

function FrameChooser({ onChange }) {
    const [frames, setFrames] = useState([])
    const [choosenFrame, setChoosenFrame] = useState(null)

    const choosenFrameSRC = !!choosenFrame ? choosenFrame.src : null

    useEffect(() => {
        async function loadFrames(){
            Promise.all(
                [
                    '0xSOM', // SOM = Stripes of Movement
                    '4xSOM-Blue-Red-Yellow-Green-Overflow',
                    '4xSOM-Blue-Red-Yellow-Green',
                    'ukraine',
                    'Mixed_Bars_Overflow_Pride',
                    'Mixed_Bars_Overflow_Trans',
                    'Mixed_Bars_Overflow_Non_Binary',
                    'Volt-Stars',
                    'RectanglePurple',
                    '5xSOM-Blue',
                    '5xSOM-Green',
                    '5xSOM-Red',
                    '5xSOM-Yellow',
                    // 'pride-2022-1',
                    // 'pride-2022-2',
                    // '5xSOM-Pride',
                    // '5xSOM-White',
                    // '2xSOM-Blue-Green',
                    // '2xSOM-Red-Yellow',
                    // 'btw_VoteVolt_Balken',
                    // 'btw_Meine_Stimme_Balken',
                    // 'btw_VoteVolt_Sterne_bunt',
                    // 'btw_Meine_Stimme_Sterne_bunt',
                    // 'btw_VoteVolt_Sterne_lila',
                    // 'btw_Meine_Stimme_Sterne_lila',
                ]
                .map(async frame_filename => {
                    return {
                        name: frame_filename,
                        src: (await import(`./frames/${frame_filename}.png`)).default,
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
        <div className="FrameChooser">
            {
                frames.map(frame => {
                    const frame_src_path = frame.src
                    const isChoosen = choosenFrameSRC === frame_src_path
                    return <div
                        key={frame_src_path}
                        data-src={frame_src_path}
                        className={isChoosen ? 'frame choosen' : 'frame'}
                        onClick={() => handleImageChoosing(frame)}
                    >
                        <img alt={frame.name} src={frame_src_path} />
                    </div>
                })
            }
        </div>
    )
}

export default FrameChooser
