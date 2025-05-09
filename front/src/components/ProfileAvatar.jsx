import Elk from '../assets/profile-icons/elk.png'
import Mountain from '../assets/profile-icons/mountain.png'
import Tree from '../assets/profile-icons/tree.png'
import Trout from '../assets/profile-icons/trout.png'
import Wheel from '../assets/profile-icons/wheel.png'

export function ProfileAvatar({ variant = 1, ...props }) {
    const icons = { 1: Elk, 2: Mountain, 3: Tree, 4: Trout, 5: Wheel }
    const Src = icons[variant]
    return <img src={Src} alt="User Profile" {...props}/>
  }