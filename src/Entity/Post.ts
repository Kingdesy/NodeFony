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
export class Post {
    @PrimaryGeneratedColumn()
    id!: number;


    @Column()
    title!: string;

    @ManyToOne(() => User)
    author!: User;


    @Column()
    createdAt: Date = new Date();
}