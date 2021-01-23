import { useState, useEffect, useCallback } from 'react'

function FrameChooser({onChange}) {
    const [frames, setFrames] = useState([])
    const [choosenFrame, setChoosenFrame] = useState(null)

    useEffect(() => {
        async function loadFrames(){
            Promise.all(
                [
                    'ProfileFrame Purple',
                    'ProfileFrame Yellow Bars',
                    'ProfileFrame Red Bars',
                    'ProfileFrame Blue Bars',
                    'ProfileFrame Green Bars',
                    'ProfileFrame White Bars',
                    'ProfileFrame Mixed Bars',
                    'ProfileFrame R&Y Bars',
                    'ProfileFrame B&G Bars',
                ]
                .map(async frame_filename => {
                    return {
                        name: frame_filename,
                        src: await import(`./frames/${frame_filename}.png`),
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
        <div className="FrameChooser">
            <h2>Choose a frame:</h2>
            {
                frames.map(frame => {
                    const frame_src_path = frame.src.default
                    const isChoosen = choosenFrame === frame_src_path
                    return <img alt={frame.name} key={frame_src_path} data-src={frame_src_path} src={frame_src_path} className={isChoosen ? 'frame choosen' : 'frame'} onClick={handleImageChoosing}/>
                })
            }             
        </div>
    )
}

export default FrameChooser
