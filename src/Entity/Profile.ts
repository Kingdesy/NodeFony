import { User } from './User';
import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    OneToMany, 
    ManyToMany, 
    OneToOne, 
    JoinTable, 
    JoinColumn 
} from 'typeorm';


@Entity()
export class Profile {
    @PrimaryGeneratedColumn()
    id!: number;


    @Column()
    bio!: string;


    @Column()
    createdAt: Date = new Date();

    @OneToOne(() => User, (user) => user.profile)
    user!: User;

}